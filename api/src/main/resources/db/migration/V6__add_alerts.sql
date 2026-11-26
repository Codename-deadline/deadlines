ALTER TABLE deadlines
    ADD COLUMN kind varchar(16) NOT NULL DEFAULT 'DEADLINE',
    ADD CONSTRAINT ck_deadlines_kind CHECK (kind IN ('DEADLINE', 'ALERT')),
    ADD CONSTRAINT ck_alert_not_completed CHECK (kind <> 'ALERT' OR is_completed = false);

-- Append the column to preserve the existing view's column order.
CREATE OR REPLACE VIEW deadline_notification_recipients AS
SELECT
    d.id AS deadline_id,
    d.title AS deadline_title,
    d.due,
    d.is_completed,
    t.id AS thread_id,
    t.title AS thread_title,
    o.id AS organization_id,
    o.title AS organization_title,
    c.id AS chat_id,
    c.messenger_chat_id,
    c.messenger,
    c.language,
    c.time_zone,
    d.kind
FROM deadlines d
JOIN threads t ON t.id = d.thread_id
JOIN organizations o ON o.id = t.organization_id
JOIN LATERAL (
    SELECT cs.chat_id FROM chat_subscriptions cs
    WHERE cs.scope_type = 'DDL' AND cs.scope_id = d.id
    UNION
    SELECT cs.chat_id FROM chat_subscriptions cs
    WHERE cs.scope_type = 'THR' AND cs.scope_id = t.id
    UNION
    SELECT cs.chat_id FROM chat_subscriptions cs
    WHERE cs.scope_type = 'ORG' AND cs.scope_id = o.id
) subscriptions ON true
JOIN chats c ON c.id = subscriptions.chat_id;
