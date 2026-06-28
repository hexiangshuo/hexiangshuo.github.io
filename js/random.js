// source/js/random.js
function getRandomPost() {
    if (typeof postsList === 'undefined' || postsList.length === 0) {
        console.warn('没有文章数据');
        return;
    }
    var index = Math.floor(Math.random() * postsList.length);
    var url = postsList[index];
    window.location.href = url;
}

document.addEventListener('DOMContentLoaded', function() {
    var randomLink = document.querySelector('a[href="#random"]');
    if (randomLink) {
        randomLink.addEventListener('click', function(e) {
            e.preventDefault();
            getRandomPost();
        });
    }
});