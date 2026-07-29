import React,{useEffect,useState} from "react";
import axios from "axios";
import "./History.css";

function History(){

const [history,setHistory]=useState([]);

useEffect(()=>{

const getHistory=async()=>{

try{

const token=localStorage.getItem("token");

const res=await axios.get(
"https://mern-project-b418.onrender.com/api/history",
{
headers:{
Authorization:`Bearer ${token}`
}
}
);

setHistory(res.data.data);

}catch(error){

console.log(
"History Error:",
error
);

}

};

getHistory();

},[]);


return(

<div className="history-page">

<h1>
📚 My Learning History
</h1>


{
history.length===0 ?

<p>
No analysis history found.
</p>

:

history.map((item,index)=>(

<div
className="history-card"
key={index}
>

<h3>
Video Analysis #{index+1}
</h3>


<p>
🔗 {item.youtubeUrl}
</p>


<p>
⚡ Option: {item.option}
</p>


{
item.summary &&

<div>

<h4>
📄 Summary
</h4>

<p>
{item.summary}
</p>

</div>
}



{
item.quiz &&
item.quiz.length>0 &&

<div>

<h4>
📝 Quiz
</h4>


{
item.quiz.map((quiz,index)=>(

<div
key={index}
className="quiz-history"
>

<h5>
Q{index+1}. {quiz.question}
</h5>

<p>
✅ {quiz.answer}
</p>

</div>

))

}

</div>

}



{
item.explanation &&

<div>

<h4>
💡 Explanation
</h4>

<p>
{item.explanation}
</p>

</div>

}



<p>
📅 {
new Date(
item.createdAt
).toLocaleDateString()
}
</p>


</div>

))

}

</div>

);

}

export default History;