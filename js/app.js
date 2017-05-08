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

var loadData = function () {
    var retval;
    return fetch('demo.json').then(function (res) {
        return res.json();
    }).then(function (data) {
        retval = data;
        //data is the object dataset of restaurant and foods;
        var promises = [];
        for (var key in data) {
            //food is all kinds of food in certain restaurant
            var food = data[key].foods;
            var newFood = food.map(function (f) {
                //for each recipe in food ,ask for nutrition and add ingredient calories and total calories in recipe;
                //return recipe
                return queryNutriApi(f.recipe).then(function (n) {
                    f.nutritions = n;
                    f.totalCalories = Object.keys(n).reduce(function (previous, current) {
                        if (current) {
                            previous += n[current].calories;
                        }
                        return previous;
                    }, 0);
                });
            });
            promises.push(Promise.all(newFood));
        };
        return promises;
    }).then(function () { return retval; })
};
