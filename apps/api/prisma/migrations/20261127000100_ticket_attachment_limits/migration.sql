ALTER TABLE "TicketAttachment"
  ADD CONSTRAINT "TicketAttachment_size_max_5mib" CHECK ("sizeBytes" <= 5242880);

CREATE INDEX "Ticket_institutionId_courseId_sectionId_idx"
  ON "Ticket"("institutionId", "courseId", "sectionId");
