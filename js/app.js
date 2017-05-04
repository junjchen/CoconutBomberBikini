function queryNutriApi(query) {
    var nutriURL = 'https://trackapi.nutritionix.com/v2/natural/nutrients';

    return fetch(nutriURL, {
        method: 'POST',
        redirect: 'follow',
        headers: new Headers({
            'Content-Type': 'application/JSON',
            'x-app-id': '4b62710c',
            'x-app-key': '6fa130a6fe641daca440813fa94c98d0'
        }),
        body: JSON.stringify({
            'query': query,
            'timezone': 'US/Eastern'
        })
    }).
    then(function (res) {
        return res.json();
    }).
    then(function (data) {
        console.log(data.food);
        return data.foods.reduce(function (previous, current) {
            var name = current.food_name;
            if (!previous[name]) {
                previous[name] = {
                    name: name,
                    weight: current.serving_weight_grams,
                    calories: current.nf_calories
                }
            } else {
                previous[name].weight += current.serving_weight_grams;
                previous[name].calories += current.nf_calories;
            }
            return previous;
        }, []);
    });
}

function getAppData() {
    var demoData = [{
        name: 'Vivian Home',
        foods: [{
                name: 'Pan fried egg',
                recipe: '1 large egg, 1 tsp salt, 5g olive oil'
            },
            {
                name: 'Honey milk',
                recipe: '0.3 liter milk, 1 tsp honey'
            }
        ]
    }];
    var getFoodArr = function(demoData,homeName){
        for(var key in demoData)
        {
            if(demoData[key].name === homeName)
            {
                var food = demoData[key].foods;
                return food;//search a restaurant and return its food menu array
            }
        };
    }
    var getFoodCalories = function (recipeName) {
        return queryNutriApi(recipeName.recipe).then(function (n) {
            recipeName.nutritions = n;
            return recipeName;//for each recipe after adding nutrition ,return the recipe Obj
        })
    }
    var getRestaurantFoodCalories = function(homeName){
        var food = getFoodArr(demoData,homeName);
        var recipeObj = food.map(function(f){
        return getFoodCalories(f);
        })
        return recipeObj;//adding nutritions to all recipes in restaurant
    }
    

 /*   var getResFoodCalories = function (resaurants) {
        return [].concat.apply([], restaurants.map(function (r) {
            return r.foods.map(function (f) {
                return getFoodCalories(f);
            });
        }));
    }*/

   Promise.all(getRestaurantFoodCalories('Vivian Home')).then(function (result) {
        console.log(result);
    })
}

// var q = '1/2 cup vegetable oil, 6 anchovy fillets ,1 small garlic clove , 2 large eggs ,2 tablespoons lemon juice , 3/4 teaspoon Dijon mustard , 2 tablespoon olive oil , 3 tablespoons ground black pepper , 1 pieces bread , 3 tablespoons olive oil , 3 romaine hearts';
// queryNutriApi(q).then(function (result) {
//     console.log(result);
//});

getAppData();