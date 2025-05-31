import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    Get,
    Param,
    Res,
    Query,
    DefaultValuePipe,
    ParseIntPipe,
  } from '@nestjs/common';
  import { FileInterceptor } from '@nestjs/platform-express';
  import { S3Service } from '../s3/s3.service';
  import { Response } from 'express';
  import { randomUUID } from 'crypto';
  
  @Controller('files')
  export class FilesController {
    constructor(private readonly s3: S3Service) {}
  
    /* ---------- POST /files  (upload) ---------- */
    @Post()
    @UseInterceptors(FileInterceptor('file'))
    async upload(@UploadedFile() file: Express.Multer.File) {
      const key = `${randomUUID()}-${file.originalname}`;
      await this.s3.upload(key, file.buffer, file.mimetype);
      return { key };         // JSON response: { "key": "…" }
    }
  
    /* ---------- GET /files/:key  (Nest streams it) ---------- */
    @Get(':key')
    async download(@Param('key') key: string, @Res() res: Response) {
      const stream = await this.s3.stream(key);
      stream.pipe(res);       // pipe S3 stream → HTTP response
    }
  
    /* ---------- GET /files/:key/presign?expires=300 ---------- */
    @Get(':key/presign')
    async presign(
      @Param('key') key: string,
      @Query('expires', new DefaultValuePipe(300), ParseIntPipe) expires: number,
    ) {
      return { url: await this.s3.presign(key, expires) };
    }
  }
  