const closingMessage = document.querySelector('.closing-message');
let letterIndex = 0;
closingMessage.querySelectorAll('p').forEach(paragraph => {
 const nodes = Array.from(paragraph.childNodes);
 paragraph.replaceChildren();
 nodes.forEach(node => {
  if(node.nodeName === 'BR') { paragraph.append(document.createElement('br')); return; }
  Array.from(node.textContent).forEach(letter => {
   const span = document.createElement('span'); span.textContent = letter;
   span.style.setProperty('--letter-delay', `${letterIndex++ * 70}ms`);
   paragraph.append(span);
  });
 });
});
const closingObserver = new IntersectionObserver(entries => {
 if(entries.some(entry => entry.isIntersecting)) { closingMessage.classList.add('writing'); closingObserver.disconnect(); }
}, {threshold:0.4});
closingObserver.observe(document.querySelector('.closing-photo'));
