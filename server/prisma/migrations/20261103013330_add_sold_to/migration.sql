-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "soldTo" TEXT;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_soldTo_fkey" FOREIGN KEY ("soldTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
