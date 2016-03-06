
window.addEventListener('load', function(){
    let p = document.getElementById('text');
    p.addEventListener('click', function(){
        p.innerHTML += 'hello';
    })
})