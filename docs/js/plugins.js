$.fn.FoodList = function (foods) {
    this.empty()
    var source = $('#food-template').html()
    var template = Handlebars.compile(source)
    var that = this
    foods.forEach(function (f) {
        var context = {
            id: f.id,
            name: f.name,
            description: f.recipe,
            image: f.image,
            calories: f.totalCalories.toFixed(2),
            price: f.price.toFixed(2),
        }
        var html = template(context)
        that.append(html)
    })

    that.children('.d-card')
    .on('click', '.js-d-card__btn-remove', function(evt) {
        var ct = evt.currentTarget
        console.log(ct)
        console.log(evt.target)
    })
    .on('click', '.js-d-card__btn-add', function(evt) {

    })

}