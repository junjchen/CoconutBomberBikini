document.querySelector('#processbar').addEventListener('mdl-componentupgraded', function () {
                this.MaterialProgress.setProgress(0);
            });
var payprogressbar=function(){
    document.querySelector('#processbar').addEventListener('mdl-componentupgraded', function () {
                this.MaterialProgress.setProgress(25);
            });
}
function changeprogressbar_pay(){
     document.querySelector('#processbar').addEventListener('mdl-componentupgraded', function () {
                this.MaterialProgress.setProgress(25);            
});
}
function changeprogressbar_deliver(){
     document.querySelector('#processbar').addEventListener('mdl-componentupgraded', function () {
                this.MaterialProgress.setProgress(50);            
});
}
function changeprogressbar_review(){
     document.querySelector('#processbar').addEventListener('mdl-componentupgraded', function () {
                this.MaterialProgress.setProgress(75);            
});
}
function changeprogressbar_done(){
     document.querySelector('#processbar').addEventListener('mdl-componentupgraded', function () {
                this.MaterialProgress.setProgress(100);            
});
}
function paybycard(){
    document.querySelector('#processbar2').style.visibility="visible";
    var t=setTimeout(function(){location.href='delivery.html'},5000);

    /**/
}
function changeDelivery(){
   
    setInterval(function(){
    document.querySelector('.mdl-stepper#deliveryprocess').MaterialStepper.next();
},5000);
}
function autopay(){
    setTimeout(paybycard,8000);
}

function autoCheckout(){
    setTimeout(function(){location.href="payment.html"},8000);
}
function add(e){
   
   var n = +(e.parentElement.childNodes[3].innerText)+1;
   e.parentElement.childNodes[3].innerText = n;
   var tprice = +(e.parentElement.parentElement.childNodes[9].innerText)* n;
   e.parentElement.parentElement.childNodes[11].innerText=tprice+'.00';
   calculatetotalprice();
}
function minus(e){
   
   var n = +(e.parentElement.childNodes[3].innerText)-1;
   if((n-1)>0)
   {
     e.parentElement.childNodes[3].innerText = n;  
     var tprice = +(e.parentElement.parentElement.childNodes[9].innerText)* n;
    e.parentElement.parentElement.childNodes[11].innerText=tprice+'.00';
   }else{
       e.parentElement.childNodes[3].innerText = 0;
       var tprice = 0;
    e.parentElement.parentElement.childNodes[11].innerText=tprice+'.00';
    
   }
   calculatetotalprice();
   
}
function deleteItems(e){
    var n = e.parentNode.parentElement.rowIndex;
    document.getElementById('order_table1').deleteRow(n);
    
}
function defaultcalttp(){
    
    
}
function calculatetotalprice(){
   
    var p = document.querySelectorAll("td#cell_tprice");
    var ttp = 0;
    for(var i=0;i<p.length;i++)
    {
        ttp+= +(p[i].innerText);
    } 
    document.getElementById("alltotalprice").innerText = ttp+".00";
}