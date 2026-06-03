import { Controller, Post, Get, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { InvoiceUploadService } from './invoice-upload.service';
import * as path from 'path';

@ApiTags('invoices')
@Controller('invoices')
export class InvoiceUploadController {
  constructor(private readonly service: InvoiceUploadService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload electricity invoice (PDF or image) for kWh extraction' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/invoices',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${path.extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (_req, file, cb) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'text/plain'];
        cb(null, allowed.includes(file.mimetype));
      },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    return this.service.upload(file);
  }

  @Get()
  @ApiOperation({ summary: 'List all uploaded invoices' })
  findAll() { return this.service.findAll(); }

  @Get('annual-summary')
  @ApiOperation({ summary: 'Get estimated annual kWh usage from processed invoices' })
  annualSummary() { return this.service.getAnnualUsageSummary(); }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by id' })
  findOne(@Param('id') id: string) { return this.service.findOne(+id); }
}
