import { useState } from 'react'
import { api } from '@utils/network.js'

const Home = () => {
  const [result, setResult] = useState({"msg": ""})
  const eventSubmit = e => {
    e.preventDefault()
    api.get("/gateway/main")
    .then(res => {
      console.log(res)
      setResult(res.data)
    })
    .catch(err => console.log(err));
  }
  return (
    <div className="container mt-3">
			<h1 className="display-1 text-center">환영 합니다.</h1>
      <form onSubmit={eventSubmit}>
        <button type='submit'>확인</button>
      </form>
      <pre>{JSON.stringify(result, null, 2)}</pre>
		</div>
  )
}

export default Home