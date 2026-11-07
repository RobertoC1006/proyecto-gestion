-- PKCE y recuperación solo en servidor; el navegador recibe una cookie opaca.
CREATE TABLE "AuthFlow" (
  "id" VARCHAR(64) PRIMARY KEY, "purpose" VARCHAR(20) NOT NULL,
  "secret" TEXT NOT NULL, "expiresAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "AuthFlow_purpose_check" CHECK ("purpose" IN ('signup', 'recovery', 'password'))
);
