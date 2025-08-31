-- DropForeignKey
ALTER TABLE "DocumentShare" DROP CONSTRAINT "DocumentShare_document_id_fkey";

-- DropForeignKey
ALTER TABLE "DocumentShare" DROP CONSTRAINT "DocumentShare_user_id_fkey";

-- AddForeignKey
ALTER TABLE "DocumentShare" ADD CONSTRAINT "DocumentShare_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "Document"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentShare" ADD CONSTRAINT "DocumentShare_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
