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
