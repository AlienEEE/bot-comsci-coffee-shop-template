const express = require('express')
const cors = require('cors')
const line = require('@line/bot-sdk')
const message = require('./message')
var firebase = require('firebase-admin')

require('dotenv').config()

const app = express()
const port = process.env.PORT || 3001

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})

//-------------- LINE SDK --------------------
// create LINE SDK config from env variables
const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
}

// create LINE SDK client
const client = new line.Client(config)
//-------------- LINE SDK --------------------

//-------------- Firebase --------------------
var serviceAccount = require('./comsci-coffee-shop.json')

firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL,
})

let db = firebase.database()
//-------------- Firebase --------------------

//---------SET RESPONSE HEADER------------
app.use(express.json())
app.use(
  express.urlencoded({
    extended: true,
  })
)
app.use(cors())

//Get Products
app.get('/products/:userId', async (req, res) => {
  var userId = req.params.userId

  try {
    var productPath = '/Products/'
    var products = db.ref(productPath)

    products.on(
      'value',
      async (snapshot) => {
        let prods = snapshot.val()

        var cartPath = '/Cart/'
        var cartdb = db.ref(cartPath)

        cartdb.child(userId).once('value', async function (snapshot) {
          let cart = snapshot.val()

          await prods.coffees.forEach((coff) => {
            let qty = 0
            if (cart && cart.coffees) {
              Object.keys(cart.coffees).map((key) =>
                cart.coffees[key].coffeeId === coff.coffeeId
                  ? (qty = qty + cart.coffees[key].qty)
                  : 0
              )
            }
            coff.qty = qty
            coff.sweet = 1
            coff.type = 0
          })

          await prods.bakeries.forEach((baker) => {
            let qty = 0
            if (cart && cart.bakeries) {
              Object.keys(cart.bakeries).map((key) =>
                cart.bakeries[key].bakeryId === baker.bakeryId
                  ? (qty = qty + cart.bakeries[key].qty)
                  : 0
              )
            }
            baker.qty = qty
          })

          return res
            .status(200)
            .send({ error: false, message: 'product data', data: prods })
        })
      },
      (errorObject) => {
        console.log('The read failed: ' + errorObject.name)
      }
    )
  } catch (err) {
    //console.log(err)
    return err
  }
})

//Add to Cart
app.post('/cart', async (req, res) => {
  var userId = req.body.lineId
  var itemAdd = req.body.data

  var type = itemAdd.coffeeId === undefined ? 'bakeries' : 'coffees'

  try {
    var cartPath = '/Cart/' + userId + '/' + type + '/'
    var cartdb = db.ref(cartPath)

    cartdb.once('value', function (snapshot) {
      let cart = snapshot.val()
      let index = undefined

      if (cart) {
        //Check if not empty cart

        if (type === 'coffees') {
          Object.keys(cart).map((key) =>
            cart[key].coffeeId === itemAdd.coffeeId &&
            cart[key].sweet === itemAdd.sweet &&
            cart[key].type === itemAdd.type
              ? (index = key)
              : 0
          )
        } else {
          Object.keys(cart).map((key) =>
            cart[key].bakeryId === itemAdd.bakeryId ? (index = key) : 0
          )
        }
      }

      //Update cart (item exist)
      if (index !== undefined) {
        let cartPath = '/Cart/' + userId + '/' + type + '/' + index + '/'
        let cartdb = db.ref(cartPath)

        cartdb.update(
          {
            qty: cart[index].qty + 1,
          },
          function (error) {
            if (error) {
              res.send('Data could not be saved.' + error)
            } else {
              return res
                .status(201)
                .send({ error: false, message: 'item updated!' })
            }
          }
        )
      } else {
        //Add new item to cart

        let cartPath = '/Cart/' + userId + '/' + type + '/'
        let cartdb = db.ref(cartPath)
        itemAdd.qty = 1
        cartdb.push(itemAdd, function (error) {
          if (error) {
            res.send('Data could not be saved.' + error)
          } else {
            return res
              .status(201)
              .send({ error: false, message: 'item added!' })
          }
        })
      }
    })
  } catch (err) {
    return res.status(404).send({ error: false, message: 'fail to add item!' })
  }
})

//Delete
app.delete('/cart', async (req, res) => {
  var userId = req.body.lineId

  var itemDel = req.body.data

  var type = itemDel.coffeeId === undefined ? 'bakeries' : 'coffees'

  try {
    var cartPath = '/Cart/' + userId + '/' + type + '/'
    var cartdb = db.ref(cartPath)

    cartdb.once('value', async function (snapshot) {
      let cart = snapshot.val()
      let index = undefined

      if (type === 'coffees') {
        index = Object.keys(cart).map((key) =>
          !(cart[key] === undefined) && cart[key].coffeeId === itemDel.coffeeId
            ? key
            : undefined
        )
      } else {
        index = Object.keys(cart).map((key) =>
          !(cart[key] === undefined) && cart[key].bakeryId === itemDel.bakeryId
            ? key
            : undefined
        )
      }

      index.forEach(async (indx) => {
        if (indx !== undefined) {
          let cartPath = '/Cart/' + userId + '/' + type + '/' + indx + '/'
          let cartdb = db.ref(cartPath)
          await cartdb.remove()
        }
      })

      return res.status(200).send({ error: false, message: 'item deleted!' })
    })
  } catch (err) {
    return res
      .status(404)
      .send({ error: false, message: 'fail to delete item!' })
  }
})

// app.use(function (req, res, next) {
//   res.header('Access-Control-Allow-Origin', '*')
//   next()
// })
//----------------------------------------
//-----------------BOT-----------------
app.post('/bot/api', async (req, res) => {
  // req.body.events should be an array of events
  if (!Array.isArray(req.body.events)) {
    return res.status(500).end()
  }

  if (req.body.events.length == 0) {
    return res.status(200).end()
  }

  let type = req.body.events[0].type
  let replyToken = req.body.events[0].replyToken
  let userId = req.body.events[0].source.userId

  menuMsg = {
    type: 'template',
    altText: 'เลือกเมนูกาแฟหรือเบเกอรี่',
    template: {
      type: 'image_carousel',
      columns: [
        {
          imageUrl:
            'https://raw.githubusercontent.com/kesinee-bo/sp01/master/LIFF/ShowCoffeeMenu.png',
          action: {
            type: 'uri',
            label: 'Coffee Menu',
            uri: `https://liff.line.me/${process.env.LIFF_ID_COFFEE}`,
          },
        },
        {
          imageUrl:
            'https://raw.githubusercontent.com/kesinee-bo/sp01/master/LIFF/ShowBakeryMenu.jpg',
          action: {
            type: 'uri',
            label: 'Bakery Menu',
            uri: `https://liff.line.me/${process.env.LIFF_ID_BAKERY}`,
          },
        },
      ],
    },
  }

  switch (type) {
    case 'message':
      let messageType = req.body.events[0].message.type

      switch (messageType) {
        case 'text':
          let text = req.body.events[0].message.text

          if (text === 'แสดงเมนูของร้าน') {
            client.replyMessage(replyToken, menuMsg)
          } else if (text === 'แสดงข้อมูลสินค้าในตระกร้า') {
            let msg = await message.cart_data(getCart, userId)
            client.replyMessage(replyToken, msg)
          }

          break

        default:
      }
  }
})

//----------Get Cart
async function getCart(userId) {
  try {
    var cartPath = '/Cart/'
    var cartdb = db.ref(cartPath)

    let snapshot = await cartdb.child(userId).once('value') //,async function(snapshot) {

    let cart = await snapshot.val()

    let coffeeArray = []
    let bakeryArray = []

    if (cart) {
      if (cart.coffees) {
        await Object.keys(cart.coffees).map((key) => {
          coffeeArray.push(cart.coffees[key])
        })

        function compare(a, b) {
          if (a.coffeeId < b.coffeeId) {
            return -1
          }
          if (a.coffeeId > b.coffeeId) {
            return 1
          }
          return 0
        }

        coffeeArray.sort(compare)
      }

      if (cart.bakeries) {
        await Object.keys(cart.bakeries).map((key) => {
          bakeryArray.push(cart.bakeries[key])
        })
      }
    }

    let cartData = { coffees: coffeeArray, bakeries: bakeryArray }

    return cartData
  } catch (err) {
    //console.log(err)
    throw err
  }
}

//-------------------LIFF-----------------

//Register (Set RichMenu)
app.post('/user/:userid', (req, res) => {
  var userid = req.params.userid
  var richmenu = process.env.RICHMENU_ID

  var lineId = req.body.lineId
  var lineName = req.body.lineName
  var firstName = req.body.firstName
  var lastName = req.body.lastName
  var phone = req.body.phone
  var address = req.body.address

  //Set variable from reg.body

  var userPath = '/Users/' + userid + '/'

  //Add to Firebase
  var users = db.ref(userPath)
  if (users !== null) {
    users.update(
      {
        lineId: lineId,
        lineName: lineName,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
        address: address,
      },
      function (error) {
        if (error) {
          res.send('Data could not be saved.' + error)
        } else {
          //Cal line bot sdk  to set richmenu

          return client.linkRichMenuToUser(userid, richmenu).then(() => {
            console.log('test')
            res.status(200).end()
          })
        }
      }
    )
  }
})

//Logout (Remove RichMenu)
app.delete('/user/:userid', (req, res) => {
  //Homework
})

//--------------------------------------

//----------Get User Detail by TokenID
const axios = require('axios')
const jwt = require('jsonwebtoken')
const { sign, verify, verify_token } = require('./middleware')

async function getUserByTokenID1(lineIdToken) {
  var decoded = jwt.decode(lineIdToken)

  var userId
  if (decoded.sub === null) {
    userId = ''
  } else {
    userId = decoded.sub
  }

  return userId
}

async function getUserByTokenID2(lineIdToken, channelId) {
  let userId = ''

  const params = new URLSearchParams()
  params.append('id_token', lineIdToken)
  params.append('client_id', channelId)

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  }

  const decode = await axios.post(
    'https://api.line.me/oauth2/v2.1/verify',
    params,
    headers
  )

  if (decode.data.sub === null) {
    userId = ''
  } else {
    userId = decode.data.sub
  }

  return userId
}

app.post('/user_tokenid/', async (req, res) => {
  var lineIdToken = req.body.lineIdToken

  var userId1 = await getUserByTokenID1(lineIdToken)

  var userId2 = await getUserByTokenID2(lineIdToken, process.env.CHANNEL_ID)
  if (userId2 === null) {
    userId2 = ''
  }

  return res.send({ error: false, userId1: userId1, userId2: userId2 })
})
//----------------------------------------

//----------JWT
app.post('/auth/user', async (req, res) => {
  var userId = req.body.userId
  var name = req.body.name

  let secretkey = process.env.SECRET
  let userDetail = {
    userId: userId,
    name: name,
  }

  let token = await sign(userDetail, secretkey)

  return res.status(201).send({
    error: false,
    accessToken: token,
  })
})

app.post('/auth/verify_token', async (req, res) => {
  var accessToken = req.body.accessToken

  let result = await verify_token(accessToken)

  if (result) {
    return res.status(200).send({
      verify_status: 'pass',
      message: 'accessToken is valid',
    })
  } else {
    return res.status(200).send({
      verify_status: 'fail',
      message: 'accessToken is not valid',
    })
  }
})

app.get('/test', verify, async (req, res) => {
  return res.status(200).send({
    message: 'Hello World!',
  })
})
//----------------------------------------
