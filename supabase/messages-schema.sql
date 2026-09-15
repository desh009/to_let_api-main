-- =====================================================
-- Realtime Chat & Messaging Schema (FIXED)
-- =====================================================

-- 1. Conversations Table
-- Stores conversation metadata between users
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id bigint REFERENCES public.to_let_api(id) ON DELETE CASCADE,

  -- Participants
  buyer_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Last message info for list view
  last_message_text text,
  last_message_time timestamptz,
  last_message_sender_id uuid REFERENCES auth.users(id),

  -- Unread counts
  buyer_unread_count integer DEFAULT 0,
  seller_unread_count integer DEFAULT 0,

  -- Status
  is_archived boolean DEFAULT false,
  is_blocked boolean DEFAULT false,
  blocked_by_user_id uuid REFERENCES auth.users(id),

  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Ensure unique conversation per listing between two users
  CONSTRAINT unique_listing_conversation UNIQUE (listing_id, buyer_id, seller_id),

  -- Ensure at least one participant is not null and buyer/seller are different
  CONSTRAINT check_participants CHECK (buyer_id != seller_id)

  -- NOTE: the old "unique_direct_conversation" table-level UNIQUE constraint
  -- using CASE/LEAST/GREATEST + WHERE has been REMOVED from here.
  -- Postgres does not allow expressions or a WHERE clause inside a table
  -- CONSTRAINT (...) block — that's what caused:
  --   ERROR: 42601: syntax error at or near "CASE"
  -- The equivalent rule is now created below as a partial UNIQUE INDEX
  -- (see "Indexes for Performance" section, unique_direct_conversation_idx).
);

-- 2. Messages Table
-- Stores individual messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,

  -- Sender info
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Message content
  message_text text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'listing', 'system')),

  -- Metadata for special message types
  metadata jsonb DEFAULT '{}'::jsonb,

  -- Status
  is_read boolean DEFAULT false,
  read_at timestamptz,
  is_deleted boolean DEFAULT false,
  deleted_by_user_id uuid REFERENCES auth.users(id),

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Conversation Participants View
-- Helper view to get participant details
CREATE OR REPLACE VIEW public.conversation_participants AS
SELECT
  c.id as conversation_id,
  c.listing_id,
  c.buyer_id,
  c.seller_id,
  buyer.email as buyer_email,
  buyer.raw_user_meta_data->>'name' as buyer_name,
  seller.email as seller_email,
  seller.raw_user_meta_data->>'name' as seller_name,
  l.title as listing_title,
  l.image_url as listing_image,
  l.price as listing_price
FROM public.conversations c
LEFT JOIN auth.users buyer ON c.buyer_id = buyer.id
LEFT JOIN auth.users seller ON c.seller_id = seller.id
LEFT JOIN public.to_let_api l ON c.listing_id = l.id;

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS conversations_buyer_id_idx ON public.conversations(buyer_id);
CREATE INDEX IF NOT EXISTS conversations_seller_id_idx ON public.conversations(seller_id);
CREATE INDEX IF NOT EXISTS conversations_listing_id_idx ON public.conversations(listing_id);
CREATE INDEX IF NOT EXISTS conversations_last_message_time_idx ON public.conversations(last_message_time DESC);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON public.conversations(updated_at DESC);

-- FIX: partial unique index replacing the invalid table-level constraint.
-- Prevents duplicate direct (no-listing) conversations between the same
-- two users, regardless of who is stored as buyer/seller.
-- buyer_id and seller_id are both NOT NULL, so NULLS NOT DISTINCT is not needed.
CREATE UNIQUE INDEX IF NOT EXISTS unique_direct_conversation_idx
  ON public.conversations (LEAST(buyer_id, seller_id), GREATEST(buyer_id, seller_id))
  WHERE listing_id IS NULL;

-- Messages indexes
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_receiver_id_idx ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS messages_is_read_idx ON public.messages(is_read) WHERE is_read = false;

-- =====================================================
-- Triggers
-- =====================================================

-- Update conversation's updated_at on new message
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update conversation metadata
  UPDATE public.conversations
  SET
    last_message_text = NEW.message_text,
    last_message_time = NEW.created_at,
    last_message_sender_id = NEW.sender_id,
    updated_at = NEW.created_at,
    -- Increment unread count for receiver
    buyer_unread_count = CASE
      WHEN NEW.receiver_id = buyer_id THEN buyer_unread_count + 1
      ELSE buyer_unread_count
    END,
    seller_unread_count = CASE
      WHEN NEW.receiver_id = seller_id THEN seller_unread_count + 1
      ELSE seller_unread_count
    END
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();

-- Reset unread count when messages are read
CREATE OR REPLACE FUNCTION reset_unread_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    UPDATE public.conversations
    SET
      buyer_unread_count = CASE
        WHEN NEW.receiver_id = buyer_id AND buyer_unread_count > 0
        THEN buyer_unread_count - 1
        ELSE buyer_unread_count
      END,
      seller_unread_count = CASE
        WHEN NEW.receiver_id = seller_id AND seller_unread_count > 0
        THEN seller_unread_count - 1
        ELSE seller_unread_count
      END
    WHERE id = NEW.conversation_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_message_read
  AFTER UPDATE ON public.messages
  FOR EACH ROW
  WHEN (NEW.is_read IS DISTINCT FROM OLD.is_read)
  EXECUTE FUNCTION reset_unread_count();

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can update their own conversations"
  ON public.conversations FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- FIX: the old single UPDATE policy let EITHER participant (not just the
-- sender) update ANY column of a message, including message_text — meaning
-- the receiver could silently edit someone else's message content just to
-- mark it read. Split into two narrower policies below.

-- Sender can edit their own message content/metadata
CREATE POLICY "Senders can update their own messages"
  ON public.messages FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Receiver can only update read status on messages sent to them.
-- (Column-level enforcement of "only is_read/read_at" must additionally be
-- done in application code or a trigger, since RLS alone can't restrict
-- which columns an UPDATE touches.)
CREATE POLICY "Receivers can mark messages as read"
  ON public.messages FOR UPDATE
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- =====================================================
-- Realtime Publication
-- =====================================================

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to mark all messages as read in a conversation
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
  p_conversation_id uuid,
  p_user_id uuid
)
RETURNS void AS $$
BEGIN
  UPDATE public.messages
  SET is_read = true, read_at = now()
  WHERE conversation_id = p_conversation_id
    AND receiver_id = p_user_id
    AND is_read = false;

  -- Reset unread count for this user
  UPDATE public.conversations
  SET
    buyer_unread_count = CASE
      WHEN buyer_id = p_user_id THEN 0
      ELSE buyer_unread_count
    END,
    seller_unread_count = CASE
      WHEN seller_id = p_user_id THEN 0
      ELSE seller_unread_count
    END
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get or create conversation (updated for direct messages)
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_listing_id bigint DEFAULT NULL,
  p_buyer_id uuid DEFAULT NULL,
  p_seller_id uuid DEFAULT NULL,
  p_user1_id uuid DEFAULT NULL,
  p_user2_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_conversation_id uuid;
  v_buyer_id uuid;
  v_seller_id uuid;
BEGIN
  -- Handle direct message (no listing)
  IF p_listing_id IS NULL AND p_user1_id IS NOT NULL AND p_user2_id IS NOT NULL THEN
    -- Normalize user IDs to maintain consistent ordering
    v_buyer_id := LEAST(p_user1_id, p_user2_id);
    v_seller_id := GREATEST(p_user1_id, p_user2_id);

    -- Try to find existing direct conversation
    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE listing_id IS NULL
      AND ((buyer_id = v_buyer_id AND seller_id = v_seller_id)
           OR (buyer_id = v_seller_id AND seller_id = v_buyer_id));

    -- If not found, create new direct conversation
    IF v_conversation_id IS NULL THEN
      INSERT INTO public.conversations (listing_id, buyer_id, seller_id)
      VALUES (NULL, v_buyer_id, v_seller_id)
      RETURNING id INTO v_conversation_id;
    END IF;

  -- Handle listing-based conversation
  ELSIF p_listing_id IS NOT NULL AND p_buyer_id IS NOT NULL AND p_seller_id IS NOT NULL THEN
    -- Try to find existing conversation
    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE listing_id = p_listing_id
      AND buyer_id = p_buyer_id
      AND seller_id = p_seller_id;

    -- If not found, create new conversation
    IF v_conversation_id IS NULL THEN
      INSERT INTO public.conversations (listing_id, buyer_id, seller_id)
      VALUES (p_listing_id, p_buyer_id, p_seller_id)
      RETURNING id INTO v_conversation_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid parameters: provide either (listing_id, buyer_id, seller_id) or (user1_id, user2_id)';
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get total unread count for a user
CREATE OR REPLACE FUNCTION get_total_unread_count(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_count integer;
BEGIN
  SELECT
    COALESCE(SUM(
      CASE
        WHEN buyer_id = p_user_id THEN buyer_unread_count
        WHEN seller_id = p_user_id THEN seller_unread_count
        ELSE 0
      END
    ), 0)
  INTO v_count
  FROM public.conversations
  WHERE (buyer_id = p_user_id OR seller_id = p_user_id)
    AND is_archived = false;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;