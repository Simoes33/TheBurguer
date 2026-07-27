import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class ChatSessionService {


constructor(
 private prisma: PrismaService
){}



async create(userId?: string){


return this.prisma.chatSession.create({

data:{

userId: userId ?? null,

state:"START"

}

});


}


async findByUser(userId?: string){


return this.prisma.chatSession.findFirst({

where:{
userId: userId ?? null
},

orderBy:{
createdAt:"desc"
}

});


}


async updateState(
sessionId:string,
state:string
){


return this.prisma.chatSession.update({

where:{
id:sessionId
},

data:{
state
}

});


}


}