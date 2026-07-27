import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
import { SettingsService } from '../settings/settings.service';
import { SseService } from '../common/sse/sse.service';
import { PrinterService } from './printer/printer.service';


@Injectable()
export class OrdersService {

  constructor(
    private prisma: PrismaService,
    private settingsService: SettingsService,
    private sseService: SseService,
    private printerService: PrinterService,
  ) {}



  async create(
    userId: string,
    createOrderDto: CreateOrderDto
  ) {


    // Verifica se a loja está aberta
    const { isOpen } =
      await this.settingsService.getStoreStatus();


    if (!isOpen) {

      throw new BadRequestException(
        'Desculpe, a loja está fechada no momento. Não é possível realizar pedidos.'
      );

    }



    const order = await this.prisma.$transaction(async (tx) => {


      let total = 0;


      const orderItemsData: {
        productId: string;
        quantity: number;
        price: number;
        observation?: string;
      }[] = [];



      for (const item of createOrderDto.items) {


        const product =
          await tx.product.findUnique({
            where:{
              id:item.productId
            }
          });



        if (!product) {

          throw new NotFoundException(
            `Produto '${item.productId}' não encontrado.`
          );

        }



        if (product.stock < item.quantity) {

          throw new BadRequestException(
            `Estoque insuficiente para "${product.name}". Disponível: ${product.stock}.`
          );

        }



        total += product.price * item.quantity;



        orderItemsData.push({

          productId: product.id,

          quantity:item.quantity,

          price:product.price,

          observation:item.observation

        });



        await tx.product.update({

          where:{
            id:product.id
          },

          data:{
            stock:{
              decrement:item.quantity
            }
          }

        });


      }




      return tx.order.create({

        data:{

          userId,


          total:
            Math.round(total * 100) / 100,


          items:{
            create:orderItemsData
          }

        },


        include:{


          // Dados para etiqueta
          user:{
            select:{
              name:true,
              phone:true,
              address:true,
              number:true,
              neighborhood:true
            }
          },


          items:{

            include:{

              product:true

            }

          }

        }

      });



    });




    // ============================
    // Impressão automática cozinha
    // ============================

    try {


      await this.printerService.printOrder(order);



    } catch(error){


      console.error(
        'Erro ao imprimir pedido:',
        error
      );


      // Não cancela o pedido se a Zebra falhar

    }




    return order;

  }






  async findAll() {


    return this.prisma.order.findMany({

      include:{

        user:{

          select:{

            name:true,
            email:true,
            phone:true,
            cep:true,
            address:true,
            number:true,
            complement:true,
            neighborhood:true

          }

        },


        items:{

          include:{

            product:{

              select:{

                id:true,
                name:true,
                price:true,
                imageUrl:true

              }

            }

          }

        }

      },


      orderBy:{
        createdAt:'desc'
      }

    });

  }







  async findByUser(userId:string) {


    return this.prisma.order.findMany({

      where:{
        userId
      },


      include:{

        items:{

          include:{

            product:{

              select:{

                id:true,
                name:true,
                price:true,
                imageUrl:true

              }

            }

          }

        }

      },


      orderBy:{
        createdAt:'desc'
      }

    });


  }







  async findOne(
    id:string,
    userId:string,
    role:string
  ) {


    const order =
      await this.prisma.order.findUnique({

        where:{
          id
        },


        include:{

          items:{
            include:{
              product:true
            }
          },


          user:true

        }

      });




    if(!order){

      throw new NotFoundException(
        'Pedido não encontrado'
      );

    }




    if(
      role === 'CUSTOMER' &&
      order.userId !== userId
    ){

      throw new ForbiddenException(
        'Você não tem permissão para ver este pedido'
      );

    }



    return order;

  }







  async updateStatus(
    id:string,
    status:OrderStatus
  ) {


    const updatedOrder =
      await this.prisma.$transaction(async(tx)=>{


        const order =
          await tx.order.findUnique({

            where:{
              id
            },


            include:{
              items:true
            }

          });




        if(!order){

          throw new NotFoundException(
            'Pedido não encontrado.'
          );

        }




        if(order.status === OrderStatus.CANCELLED){

          throw new BadRequestException(
            'Não é possível alterar o status de um pedido já cancelado.'
          );

        }




        if(order.status === OrderStatus.DELIVERED){

          throw new BadRequestException(
            'Não é possível alterar o status de um pedido já entregue.'
          );

        }





        if(order.status === status){

          return order;

        }




        if(status === OrderStatus.CANCELLED){


          for(const item of order.items){


            await tx.product.update({

              where:{
                id:item.productId
              },


              data:{

                stock:{
                  increment:item.quantity
                }

              }

            });


          }


        }




        return tx.order.update({

          where:{
            id
          },


          data:{
            status
          },


          include:{
            items:true
          }

        });



      });





    this.sseService.emitOrderStatusUpdate({

      orderId:id,

      status:status.toString(),

      updatedAt:new Date().toISOString()

    });




    return updatedOrder;

  }


}