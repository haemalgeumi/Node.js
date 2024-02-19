const express = require('express')
const app = express()
const { MongoClient } = require('mongodb')

let db
const url = 'mongodb+srv://admin:qwer1234@cluster0.pkaqcij.mongodb.net/?retryWrites=true&w=majority'
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('forum')

  app.listen(8080, () => {
    console.log('http://localhost:8080 에서 서버 실행중')
})
}).catch((err)=>{
  console.log(err)
})



app.get('/', (요청, 응답) => {
  응답.send('반갑다 이자식아')
})


