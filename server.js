const express = require('express')
const app = express()
const { MongoClient , ObjectId } = require('mongodb')

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

// 세팅
app.set('view engine','ejs')
app.use(express.static(__dirname + '/public'));
app.use(express.json())
app.use(express.urlencoded({extended:true})) 


app.get('/', (요청, 응답) => {
  응답.send('반갑다 이자식아')
})



app.get('/list', async(요청, 응답)=>{
  let result = await db.collection('post').find().toArray()
  응답.render('list.ejs', {글목록 : result})
})

app.get('/time', (요청, 응답)=>{
  응답.render('time.ejs', {시간 : new Date()})
})

app.get('/write', (요청, 응답)=>{
  응답.render('write.ejs');
  console.log(요청.body);
})

app.get('/detail/:id', async(요청, 응답)=>{
  try{
    let result = await db.collection('post').findOne({_id : new ObjectId(요청.params.id)})
    응답.render('detail.ejs', {result : result});
  }
  catch{
    응답.send('잘못된 URL')
  }
  
})

app.post('/add', (요청, 응답)=>{
 try{
  if(요청.body.title === '' || 요청.body.content === ''){
    응답.send('내용을 입력하시오')
  } else{
    db.collection('post').insertOne({title: 요청.body.title, content: 요청.body.content})
    응답.redirect('/list')
    console.log(요청.body);
  }
 } catch{
  응답.send('서버 에러났어요')
 }

})

app.get('/edit/:id', async(요청, 응답)=>{
  let result = await db.collection('post').findOne({_id : new ObjectId(요청.params.id)})
  응답.render('edit.ejs', {result : result});
  console.log(요청.body);
})

app.post('/edit', async(요청, 응답)=>{
  let result = await db.collection('post').updateOne({_id : new ObjectId (요청.body.id)},
  {$set : {title : 요청.body.title, content : 요청.body.content}}
  )
응답.redirect('list')
console.log(요청.body)
})

app.delete("/delete",async(요청,응답)=>{
console.log(요청.query);
let result = await db.collection("post").deleteOne({ _id : new ObjectId(요청.query.docid)})
응답.send("삭제완료")
})



