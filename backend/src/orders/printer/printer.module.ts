import { Module } from '@nestjs/common';
import { PrinterService } from './printer.service';
import { ZebraService } from './zebra/zebra.service';


@Module({

providers:[
    PrinterService,
    ZebraService
],

exports:[
    PrinterService
]

})
export class PrinterModule {}