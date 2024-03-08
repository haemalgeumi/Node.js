const express = require('express')
const app = express()
const { MongoClient , ObjectId } = require('mongodb')
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local')
const bcrypt = require('bcrypt') 
const MongoStore = require('connect-mongo')
require('dotenv').config() 
const { S3Client } = require('@aws-sdk/client-s3')
const multer = require('multer')
const multerS3 = require('multer-s3')
const s3 = new S3Client({
  region : 'ap-northeast-2',
  credentials : {
      accessKeyId :  process.env.S3_KEY,
      secretAccessKey : process.env.S3_SECRET
  }
})

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'yuniforum6',
    key: function (요청, file, cb) {
      cb(null, Date.now().toString()) //업로드시 파일명 변경가능
    }
  })
})

let db
const url =  process.env.DB_URL
new MongoClient(url).connect().then((client)=>{
  console.log('DB연결성공')
  db = client.db('forum')

  app.listen( process.env.PORT, () => {
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
app.use(passport.initialize())
app.use(session({
  secret: '2266',
  resave : false,
  saveUninitialized : false,
  cookie : { maxAge : 60 * 60 * 1000 },
  store: MongoStore.create({
    mongoUrl : 'mongodb+srv://admin:qwer1234@cluster0.pkaqcij.mongodb.net/?retryWrites=true&w=majority',
    dbName: 'forum',
  })
}))

app.use(passport.session()) 

passport.use(new LocalStrategy(async (입력한아이디, 입력한비번, cb) => {
  let result = await db.collection('member').findOne({ username : 입력한아이디})
  if (!result) {
    return cb(null, false, { message: '아이디 DB에 없음' })
  }
  if (await bcrypt.compare(입력한비번, result.password)) {
    return cb(null, result)
  } else {
    return cb(null, false, { message: '비번불일치' });
  }
}))

passport.serializeUser((user, done) => {
  process.nextTick(() => {
    done(null, { id: user._id, username: user.username })
  })
})
passport.deserializeUser((user, done) => {
  process.nextTick(() => {
    return done(null, user)
  })
})


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
  upload.single("img1") (요청,응답,(err)=>{
    if (err) return 응답.send('에러남')
    try{
      if(요청.body.title === '' || 요청.body.content === ''){
        응답.send('내용을 입력하시오')
      } else{
        db.collection('post').insertOne({title: 요청.body.title, content: 요청.body.content, img : 요청.file.location})
        응답.redirect('/list')
        console.log(요청.body);
      }
     } catch{
      응답.send('서버 에러났어요')
     }
  })
 

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


app.get('/list/:id', async(요청, 응답)=>{
  let result = await db.collection('post').find().skip((요청.params.id -1)* 5).limit(5).toArray()
  응답.render('list.ejs', {글목록 : result})
})


app.get('/signup', async(요청, 응답)=>{
  응답.render('signup.ejs')
})

app.post('/member', async(요청, 응답)=>{
  try{
   if(요청.body.username === '' || 요청.body.password === ''){
     응답.send('빈칸을 입력하시오')
   } else{
    let 해시 = await bcrypt.hash(요청.body.password, 10) 
     await db.collection('member').insertOne({username: 요청.body.username, password: 해시})
     console.log(요청.body.username);
     응답.redirect("/")
   }
  } catch{
   응답.send('서버 에러났어요')
  }
 
 })

 app.get('/login', async(요청, 응답)=>{
  응답.render('login.ejs')
})

app.post('/login', async (요청, 응답, next) => {
  passport.authenticate('local', (error, user, info) => {
      if (error) return 응답.status(500).json(error)
      if (!user) return 응답.status(401).json(info.message)
      요청.logIn(user, (err) => {
        if (err) return next(err)
        응답.redirect('/')
      })
  })(요청, 응답, next)
})

app.get('/mypage', async(요청, 응답)=>{
    응답.render('mypage.ejs',{user : 요청.user})
    console.log(요청.user)
})




