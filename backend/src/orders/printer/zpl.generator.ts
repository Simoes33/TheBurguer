export type OrderLabel = {

  id: string;

  createdAt?: Date;

  user?: {
    name: string;
    phone?: string;
    address?: string;
    number?: string;
    neighborhood?: string;
  };

  paymentMethod?: string;

  items: {
    quantity: number;

    observation?: string | null;

    product: {
      name: string;
    };

  }[];

  total: number;

};



// Remove caracteres que a Zebra pode não interpretar
function sanitize(text: string): string {

  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[~]/g, '-');

}




export function generateOrderLabel(
  order: OrderLabel
): string {


  let y = 40;


  let zpl = `

^XA
^CI28

^PW600

`;



  // Cabeçalho

  zpl += `

^FO50,${y}
^A0N,40,40
^FDTHE BURGUER^FS

`;



  y += 60;



  zpl += `

^FO50,${y}
^A0N,30,30
^FDPedido #${sanitize(order.id.substring(0,8))}^FS

`;



  y += 50;



  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleString('pt-BR')
    : new Date().toLocaleString('pt-BR');



  zpl += `

^FO50,${y}
^A0N,22,22
^FDData: ${sanitize(date)}^FS

`;



  y += 50;



  // Cliente

  zpl += `

^FO50,${y}
^A0N,30,30
^FDCLIENTE:^FS

`;



  y += 35;



  zpl += `

^FO50,${y}
^A0N,28,28
^FD${sanitize(order.user?.name ?? 'Cliente')}^FS

`;



  y += 45;



  if(order.user?.phone){

    zpl += `

^FO50,${y}
^A0N,22,22
^FDTel: ${sanitize(order.user.phone)}^FS

`;

    y += 35;

  }



  // Separador

  zpl += `

^FO50,${y}
^GB500,2,2^FS

`;



  y += 30;



  // Itens

  zpl += `

^FO50,${y}
^A0N,30,30
^FDITENS:^FS

`;



  y += 45;



  for(const item of order.items){


    zpl += `

^FO50,${y}
^A0N,28,28
^FD${item.quantity}x ${sanitize(item.product.name)}^FS

`;



    y += 40;



    if(item.observation){


      zpl += `

^FO70,${y}
^A0N,22,22
^FDObs: ${sanitize(item.observation)}^FS

`;

      y += 35;

    }


  }




  // Total

  y += 20;


  zpl += `

^FO50,${y}
^A0N,40,40
^FDTOTAL: R$ ${order.total.toFixed(2)}^FS


`;



  y += 60;



  zpl += `

^FO50,${y}
^A0N,22,22
^FDObrigado pela preferencia!^FS


^XZ

`;



  return zpl;

}