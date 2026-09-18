-- Allow anonymous and regular users to insert into contact_messages
GRANT INSERT ON public.contact_messages TO anon;

CREATE POLICY "Allow public insert on contact_messages"
ON public.contact_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow anonymous and regular users to insert into collaboration_inquiries
GRANT INSERT ON public.collaboration_inquiries TO anon;

CREATE POLICY "Allow public insert on collaboration_inquiries"
ON public.collaboration_inquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
