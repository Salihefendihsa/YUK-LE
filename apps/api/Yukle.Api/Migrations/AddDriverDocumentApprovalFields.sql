START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420171653_AddDriverDocumentApprovalFields') THEN
    ALTER TABLE "Users" ADD "DriverLicenseExpiry" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420171653_AddDriverDocumentApprovalFields') THEN
    ALTER TABLE "Users" ADD "IsActive" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420171653_AddDriverDocumentApprovalFields') THEN
    ALTER TABLE "Users" ADD "IsDriverLicenseApproved" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420171653_AddDriverDocumentApprovalFields') THEN
    ALTER TABLE "Users" ADD "IsPsychotechnicalApproved" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420171653_AddDriverDocumentApprovalFields') THEN
    ALTER TABLE "Users" ADD "IsSrcApproved" boolean NOT NULL DEFAULT FALSE;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420171653_AddDriverDocumentApprovalFields') THEN
    ALTER TABLE "Users" ADD "LastValidationMessage" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420171653_AddDriverDocumentApprovalFields') THEN
    ALTER TABLE "Users" ADD "LicenseClasses" text;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420171653_AddDriverDocumentApprovalFields') THEN
    ALTER TABLE "Users" ADD "PsychotechnicalExpiry" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420171653_AddDriverDocumentApprovalFields') THEN
    ALTER TABLE "Users" ADD "SrcExpiry" timestamp with time zone;
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260420171653_AddDriverDocumentApprovalFields') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260420171653_AddDriverDocumentApprovalFields', '9.0.2');
    END IF;
END $EF$;
COMMIT;

