document.querySelectorAll("nav a").forEach(link=>{

link.addEventListener("click",function(e){

const id=this.getAttribute("href");

if(id.startsWith("#")){

e.preventDefault();

document.querySelector(id).scrollIntoView({

behavior:"smooth"

});

}

});

});

console.log("MIM89 Ready");
window.onload=function(){

setTimeout(function(){

document.getElementById("loader").style.display="none";

},1500);

}
const slides=document.querySelectorAll(".slide");

let current=0;

setInterval(()=>{

slides[current].classList.remove("active");

current++;

if(current>=slides.length){

current=0;

}

slides[current].classList.add("active");

},4000);
const search=document.getElementById("search");

search.addEventListener("keyup",function(){

const value=this.value.toLowerCase();

const cards=document.querySelectorAll(".card");

cards.forEach(card=>{

const text=card.innerText.toLowerCase();

if(text.includes(value)){

card.style.display="inline-block";

}else{

card.style.display="none";

}

});

});
let total=172800;

setInterval(()=>{

let d=Math.floor(total/86400);

let h=Math.floor((total%86400)/3600);

let m=Math.floor((total%3600)/60);

let s=total%60;

document.getElementById("days").innerHTML=d;

document.getElementById("hours").innerHTML=h;

document.getElementById("minutes").innerHTML=m;

document.getElementById("seconds").innerHTML=s;

if(total>0){

total--;

}

},1000);
