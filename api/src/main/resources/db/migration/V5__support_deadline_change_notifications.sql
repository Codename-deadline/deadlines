ALTER TABLE notification_outbox
    ALTER COLUMN notification_id DROP NOT NULL,
    DROP CONSTRAINT ck_notification_outbox_source,
    ADD CONSTRAINT ck_notification_outbox_source CHECK (
        source IN ('DDL_EXPIRATION', 'DDL_DUE_CHANGED')
    );

CREATE VIEW deadline_notification_recipients AS
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
    c.time_zone
FROM deadlines d
JOIN threads t ON t.id = d.thread_id
JOIN organizations o ON o.id = t.organization_id
JOIN LATERAL (
    -- UNION deduplicates chats subscribed through more than one scope.
    SELECT cs.chat_id
    FROM chat_subscriptions cs
    WHERE cs.scope_type = 'DDL' AND cs.scope_id = d.id
    UNION
    SELECT cs.chat_id
    FROM chat_subscriptions cs
    WHERE cs.scope_type = 'THR' AND cs.scope_id = t.id
    UNION
    SELECT cs.chat_id
    FROM chat_subscriptions cs
    WHERE cs.scope_type = 'ORG' AND cs.scope_id = o.id
) subscriptions ON true
JOIN chats c ON c.id = subscriptions.chat_id;
