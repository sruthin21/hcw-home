import { Controller, Get, Post,Req, Put, Delete, Body, Param, Query, UseGuards, ParseIntPipe, ForbiddenException } from '@nestjs/common';import { ConsultationService } from './consultation.service';

@Controller('consultation')
export class ConsultationController {

    constructor(private readonly consultationService: ConsultationService){}

    @Post()
  async createConsultation(@Body() consultationData: any) {
    return this.consultationService.createConsultation(consultationData);
  }

  @Put(':id')
  async updateConsultation(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateData: any,
  ) {
    return this.consultationService.updateConsultation(id, updateData);
  }

  @Delete(':id')
  async cancelConsultation(@Param('id', ParseIntPipe) id: number) {
    return this.consultationService.cancelConsultation(id);
  }

  @Get('history')
  async getConsultationHistory(
    @Req() req,                    // 2) grab the authenticated user
    @Query('practitionerId', ParseIntPipe) practitionerId: number,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // 3) enforce role in-code
    if (req.user.role !== 'Practitioner') {
      throw new ForbiddenException('Only practitioners can view history');
    }

    const parsedPage  = parseInt(page,  10);
    const parsedLimit = parseInt(limit, 10);
    const parsedStart = startDate ? new Date(startDate) : undefined;
    const parsedEnd   = endDate   ? new Date(endDate)   : undefined;

    return this.consultationService.getConsultationHistory(
      practitionerId,
      parsedPage,
      parsedLimit,
      search,
      parsedStart,
      parsedEnd,
    );
  }

    @Post(':id/join/patient')
    async joinPatient(@Param('id', ParseIntPipe) id: number,  @Body('userId') userId: number,) {    
        const res = await this.consultationService.joinAsPatient(id, userId);

        return { message: 'Patient joined consultation.', ...res };
    }

    @Post(':id/join/practitioner')
    async joinPractitioner(@Param('id', ParseIntPipe) id: number,  @Body('userId') userId: number,) {
        const res = await this.consultationService.joinAsPractitioner(id, userId);

        return {message: 'Practitioner joined consultation. ', ...res}
    }

    @Get('/waiting-room')
    async getWaitingRoom(@Body('userId') userId: number) {
        const consultations = await this.consultationService.getWaitingRoomConsultations(userId);
        return {success: true, consultations};
    }

}
