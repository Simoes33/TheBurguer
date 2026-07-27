import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';


const execAsync = promisify(exec);



@Injectable()
export class ZebraService {


  private readonly printerPath =
    '\\\\DESKTOP-5TND9C0\\ZebraLabel';



  async sendToZebra(zpl:string):Promise<void>{


    const filePath =
      path.join(
        os.tmpdir(),
        `pedido-${Date.now()}.zpl`
      );



    // UTF-8 para Zebra com ^CI28
    fs.writeFileSync(
      filePath,
      Buffer.from(zpl,'utf8')
    );



    const command =
      `copy /b "${filePath}" "${this.printerPath}"`;



    try {


      await execAsync(command);



      console.log(
        '✅ Pedido enviado para Zebra'
      );



    } catch(error){


      console.error(
        '❌ Erro Zebra:',
        error
      );


      throw error;

    }


  }


}