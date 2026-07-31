document.querySelectorAll("nav a").forEach(link => {

link.addEventListener("click", function(e){

const id=this.getAttribute("href");

if(id.startsWith("#") && document.querySelector(id)){

e.preventDefault();

document.querySelector(id).scrollIntoView({

behavior:"smooth"

});

}

});

});

window.onload=function(){

setTimeout(function(){

const loader=document.getElementById("loader");

if(loader){

loader.style.display="none";

}

},1500);

};

const slides=document.querySelectorAll(".slide");

if(slides.length){

let current=0;

setInterval(function(){

slides[current].classList.remove("active");

current++;

if(current>=slides.length){

current=0;

}

slides[current].classList.add("active");

},4000);

}

const search=document.getElementById("search");

if(search){

search.addEventListener("keyup",function(){

const value=this.value.toLowerCase();

document.querySelectorAll(".card").forEach(function(card){

if(card.innerText.toLowerCase().includes(value)){
    card.style.display = "";
}else{
    card.style.display = "none";
}
const days=document.getElementById("days");

if(days){

let total=172800;

setInterval(function(){

let d=Math.floor(total/86400);

let h=Math.floor((total%86400)/3600);

let m=Math.floor((total%3600)/60);

let s=total%60;

document.getElementById("days").textContent=d;

document.getElementById("hours").textContent=h;

document.getElementById("minutes").textContent=m;

document.getElementById("seconds").textContent=s;

if(total>0){

total--;

}

},1000);

}

console.log("MIM89 Ready");
const navbar=document.getElementById("navbar");

window.addEventListener("scroll",function(){

if(window.scrollY>80){

navbar.classList.add("scrolled");

}else{

navbar.classList.remove("scrolled");

}

});
