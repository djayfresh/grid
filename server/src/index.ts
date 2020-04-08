import app from './App';

const port = process.env.PORT || 3000;

app.listen(port, (...err: any[]) => {
  if (err && err.length > 0) {
    return console.error(err)
  }

  return console.log(`server is listening on ${port}`)
});