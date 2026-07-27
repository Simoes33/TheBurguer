import { Injectable } from '@nestjs/common';
import { ZebraService } from './zebra/zebra.service';
import { generateOrderLabel } from './zpl.generator';


@Injectable()
export class PrinterService {


constructor(
    private readonly zebraService: ZebraService
){}



async printOrder(order:any){


    const zpl =
        generateOrderLabel(order);



    await this.zebraService.sendToZebra(
        zpl
    );


    return true;

}


}