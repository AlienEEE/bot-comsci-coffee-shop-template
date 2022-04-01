require('dotenv').config()

module.exports.cart_data = async function () {
  let funcGetCart = arguments[0]
  let userId = arguments[1]

  let cart = await funcGetCart(userId)

  let details = []
  let total = 0

  if (cart && (cart.coffees.length > 0 || cart.bakeries.length > 0)) {
    //Add Coffee
    if (cart.coffees) {
      cart.coffees.forEach((coff) => {
        total = total + coff.price * coff.qty
        let type = coff.type === 0 ? 'Hot' : 'Ice'
        let sweet =
          coff.sweet === 0
            ? '150% Sweet'
            : coff.sweet === 1
            ? '100% Sweet'
            : coff.sweet === 2
            ? '50% Sweet'
            : 'No Sugar'

        details.push(
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: `${coff.name}`,
                size: 'sm',
                color: '#555555',
                flex: 0,
                wrap: true,
              },
              {
                type: 'text',
                text: `${Number(coff.price * coff.qty).toLocaleString()} ฿`,
                size: 'sm',
                color: '#555555',
                align: 'end',
              },
            ],
            spacing: 'none',
            margin: 'none',
            offsetBottom: 'none',
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: `${type}, ${sweet}`,
                size: 'xxs',
                color: '#988686',
                flex: 0,
                wrap: true,
                margin: 'none',
                offsetTop: 'none',
              },
            ],
          }
        )
      })
    }

    //Add Bakeries
    if (cart.bakeries) {
      cart.bakeries.forEach((bakery) => {
        total = total + bakery.price * bakery.qty

        details.push({
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: `${bakery.name}`,
              size: 'sm',
              color: '#5C4E4E',
              flex: 0,
            },
            {
              type: 'text',
              text: `${Number(bakery.price * bakery.qty).toLocaleString()} ฿`,
              size: 'sm',
              color: '#5C4E4E',
              align: 'end',
            },
          ],
        })
      })
    }

    //Add Total
    details.push(
      {
        type: 'separator',
        margin: 'md',
        color: '#5C4E4E',
      },
      {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'text',
            text: 'TOTAL',
            size: 'sm',
            color: '#5C4E4E',
            weight: 'bold',
          },
          {
            type: 'text',
            text: `${Number(total).toLocaleString()} ฿`,
            size: 'sm',
            color: '#5C4E4E',
            align: 'end',
            weight: 'bold',
          },
        ],
        margin: 'xs',
      }
    )

    let msg = [
      {
        type: 'flex',
        altText: 'CART',
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'baseline',
            contents: [
              {
                type: 'icon',
                url: 'https://cdn-icons-png.flaticon.com/512/590/590836.png',
                size: '3xl',
                margin: 'xs',
              },
              {
                type: 'text',
                text: 'Cafe In Room',
                weight: 'bold',
                size: 'lg',
                decoration: 'none',
                color: '#ffffff',
                align: 'center',
                margin: 'none',
                gravity: 'center',
              },
              {
                type: 'icon',
                url: 'https://cdn-icons-png.flaticon.com/512/4001/4001496.png',
                size: 'xxl',
                margin: 'none',
              },
            ],
            spacing: 'none',
            margin: 'none',
            offsetTop: 'none',
            offsetBottom: 'none',
            offsetStart: 'none',
            offsetEnd: 'none',
            paddingAll: 'md',
            paddingTop: 'md',
            paddingBottom: 'md',
            paddingStart: 'md',
            paddingEnd: 'md',
          },
          hero: {
            type: 'image',
            url: 'https://cdn.discordapp.com/attachments/908277281213005884/953568677809254430/539befb0-ec3d-11ea-848c-9904d8754fa3_original.png',
            size: 'full',
            aspectRatio: '20:13.3',
            action: {
              type: 'uri',
              uri: 'http://linecorp.com/',
            },
            align: 'center',
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'box',
                layout: 'vertical',
                margin: 'md',
                spacing: 'none',
                contents: [
                  {
                    type: 'box',
                    layout: 'baseline',
                    contents: [
                      {
                        type: 'text',
                        text: 'Coffee&Bakery',
                        weight: 'bold',
                        margin: 'none',
                        size: 'sm',
                      },
                      {
                        type: 'icon',
                        url: 'https://cdn-icons-png.flaticon.com/512/2935/2935500.png',
                        size: 'xl',
                        margin: 'none',
                        position: 'relative',
                      },
                    ],
                  },
                  {
                    type: 'separator',
                    margin: 'xs',
                    color: '#000000',
                  },
                  {
                    type: 'box',
                    layout: 'horizontal',
                    contents: [
                      {
                        type: 'box',
                        layout: 'vertical',
                        margin: 'md',
                        spacing: 'sm',
                        contents: details,
                      },
                    ],
                  },
                ],
              },
              {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'button',
                    action: {
                      type: 'uri',
                      label: 'Show Details',
                      uri: 'http://linecorp.com/',
                    },
                    adjustMode: 'shrink-to-fit',
                    offsetTop: 'none',
                    offsetBottom: 'none',
                    offsetStart: 'none',
                    offsetEnd: 'none',
                    color: '#B95BF2',
                    style: 'primary',
                    margin: 'none',
                    height: 'sm',
                  },
                ],
              },
            ],
            margin: 'none',
            spacing: 'none',
            paddingTop: 'xs',
          },

          styles: {
            header: {
              backgroundColor: '#B95BF2',
              separator: false,
            },
            footer: {
              separator: true,
            },
          },
        },
      },
    ]

    return msg
  } else {
    let msg = {
      type: 'text',
      text: `คุณยังไม่มีรายการสินค้าในตระกร้า`,
    }

    return msg
  }
}
