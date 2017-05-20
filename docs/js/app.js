function queryNutriApi(query) {
    var nutriURL = 'https://trackapi.nutritionix.com/v2/natural/nutrients';

    return fetch(nutriURL, {
        method: 'POST',
        redirect: 'follow',
        headers: new Headers({
            'Content-Type': 'application/JSON',

            // first keys
            'x-app-id': '07a4c38d',
            'x-app-key': '27e2dd0670e39d5e59a47a2da754e49b',

            // second keys
            //'x-app-id': '4b62710c',
            //'x-app-key': '6fa130a6fe641daca440813fa94c98d0',

            // thirds
            //'x-app-id': '9ea96386c',
            //'x-app-key': '704f238a7e7488b9bb062876918346860',
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
                    weight: current.serving_weight_grams,
                    calories: current.nf_calories,
                    cholesterol: current.nf_cholesterol,
                    sodium: current.nf_sodium,
                    fat: current.nf_total_fat,
                    protein: current.nf_protein,
                    carbonhydrates: current.nf_total_carbohydrate,
                }
            } else {
                previous[name].weight += current.serving_weight_grams
                previous[name].calories += current.nf_calories
                previous[name].cholesterol += current.nf_cholesterol
                previous[name].sodium += current.nf_sodium
                previous[name].fat += current.nf_total_fat
                previous[name].protein += current.nf_protein
                previous[name].carbonhydrates += current.nf_total_carbohydrate
            }
            return previous;
        }, {});
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
                    var sum = function (name) {
                        var objs = Object.values(n)
                        var add = function (a, b) {
                            return a + b
                        }
                        return objs.map(function (d) {
                            return d[name]
                        }).reduce(add, 0)
                    }
                    f.calories = sum('calories')
                    f.cholesterol = sum('cholesterol')
                    f.sodium = sum('sodium')
                    f.fat = sum('fat')
                    f.protein = sum('protein')
                    f.carbonhydrates = sum('carbonhydrates')
                });
            });
            promises.push(Promise.all(newFood));
        };
        return Promise.all(promises);
    }).then(function () {
        return retval;
    }).catch(function () {
        return retval;
    })
};

$.fn.FoodList = function (foods) {
    this.empty()
    var source = $('#food-template').html()
    var template = Handlebars.compile(source)
    var ret = foods.map(function (f) {
        var context = {
            id: f.id,
            name: f.name,
            description: f.recipe,
            image: f.image,
            calories: f.calories && f.calories.toFixed(2),
            price: f.price.toFixed(2),
        }
        var $el = $(template(context))
        var clickEvts = Bacon.fromEvent($el, 'click')
        var iconClickEvts = clickEvts.filter(function (e) {
            return e.target.className === "material-icons"
        })
        var ups = iconClickEvts.filter(function (e) {
            return e.target.innerText === 'add'
        }).map(1)
        var downs = iconClickEvts.filter(function (e) {
            return e.target.innerText === 'remove'
        }).map(-1)
        var popupEvts = clickEvts.filter(function (e) {
            return e.target.className.indexOf('js-d-card__btn-detai') !== -1
        }).map(function () {
            return f
        })
        ups.merge(downs).scan(0, function (x, y) {
            var r = x + y
            return r < 0 ? 0 : r
        }).assign($el.find('.d-card__amount'), 'text')
        return {
            el: $el,
            counterEvts: ups.merge(downs),
            popupEvts: popupEvts
        }
    })
    this.append(ret.map(function (n) {
        return n.el
    }))
    return ret
}

$.fn.HomeList = function (homes) {
    this.empty()
    var source = $('#home-template').html()
    var template = Handlebars.compile(source)
    var ret = homes.map(function (h) {
        var context = {
            id: h.id,
            name: h.name,
            image: h.image
        }
        var $el = $(template(context))
        var clickEvts = Bacon.fromEvent($el, 'click').map(function () {
            return h.id
        })
        return {
            el: $el,
            clickEvts: clickEvts
        }
    })
    this.append(ret.map(function (n) {
        return n.el
    }))
    return ret
}

function renderMarkersOnMap(d, map, evtStreams) {
    var clickEvtStreams = d.map(function (r) {
        var m = L.marker([r.lat, r.lon], {
            icon: L.icon({
                iconUrl: 'images/ic_person_pin_circle_black_24px.svg',
                iconSize: [35, 35],
                className: 'd-map__icon'
            })
        }).addTo(map)
        return Bacon.fromEvent(m, 'click').map(function () {
            return r.id
        })
    })
    evtStreams.markerClick = Bacon.mergeAll(clickEvtStreams)
}

function renderSidebar(d, id) {
    var $sidebar = $('.leaflet-sidebar')
    var $sidebarContainer = $('.d-sidebar__container')
    var $sidebarHeader = $('.d-sidebar__header')

    $sidebarContainer.empty();
    $sidebarHeader.empty();


    if (id) {
        var h = d.filter(function (x) {
            return x.id == id
        })[0]
        if (!$sidebar.hasClass('leaflet-sidebar--wide')) {
            $sidebar.addClass('leaflet-sidebar--wide')
        }
        var ret = $sidebarContainer.FoodList(h.foods)
        var headerHtml = Handlebars.compile($('#food-list-header-template').html())({
            name: h.name
        })
        $sidebarHeader.append(headerHtml)

        var orderCounter = Bacon.mergeAll(ret.map(function (d) {
            return d.counterEvts
        })).scan(0, function (x, y) {
            var r = x + y
            return r < 0 ? 0 : r
        })
        orderCounter.assign($sidebarHeader.find('.js-d-sidebar__counter'), 'text')
        orderCounter.onValue(function (v) {
            if (v === 0) {
                $sidebarHeader.find('.js-d-sidebar__btn').prop('disabled', true)
            } else {
                $sidebarHeader.find('.js-d-sidebar__btn').prop('disabled', false)
            }
        })

        var popupOpener = Bacon.mergeAll(ret.map(function (d) {
            return d.popupEvts
        })).onValue(function (data) {
            document.querySelector('dialog').showModal()
            createBarChart(data)
        })


    } else {
        if ($sidebar.hasClass('leaflet-sidebar--wide')) {
            $sidebar.removeClass('leaflet-sidebar--wide')
        }
        var ret = $sidebarContainer.HomeList(d)
        var headerHtml = Handlebars.compile($('#home-list-header-template').html())({
            count: d.length
        })
        $sidebarHeader.append(headerHtml)
        Bacon.mergeAll(ret.map(function (d) {
            return d.clickEvts
        })).onValue(function (id) {
            renderSidebar(d, id)
        })
    }
}

function createBarChart(data) {
    $('.js-d-bar-chart').empty()
    $('.js-d-donut-chart').empty()
    var RI = {
        calories: 2000,
        fat: 70,
        carbonhydrates: 260,
        protein: 50,
        sodium: 2400,
        cholesterol: 300
    }
    var barChart = britecharts.bar(),
        dataset = [{
                "name": "Calories",
                "value": data.calories / RI.calories
            },
            {
                "name": "Sodium",
                "value": data.sodium / RI.sodium
            },
            {
                "name": "Cholesterol",
                "value": data.cholesterol / RI.cholesterol
            },
            {
                "name": "Carbonhydrates",
                "value": data.carbonhydrates / RI.carbonhydrates
            },
            {
                "name": "Fat",
                "value": data.fat / RI.fat
            },
            {
                "name": "Protein",
                "value": data.protein / RI.protein
            }
        ],
        barContainer = d3.select('.js-d-bar-chart'),
        barChartContainerWidth = barContainer.node().getBoundingClientRect().width

    barChart
        .margin({
            left: 120,
            right: 20,
            top: 20,
            bottom: 5
        })
        .percentageAxisToMaxRatio(1.3)
        .horizontal(true)
        .colorSchema(britecharts.colors.colorSchemas.britechartsColorSchema)
        .width(barChartContainerWidth)
        .height(300)
        .usePercentage(true)
        .enablePercentageLabels(true)
        .percentageAxisToMaxRatio(1.2)

    barContainer.datum(dataset).call(barChart);

    var donutChart = britecharts.donut(),
        donutContainer = d3.select('.js-d-donut-chart'),
        donutContainerWidth = donutContainer.node().getBoundingClientRect().width

    donutChart
        .width(donutContainerWidth)
        .height(donutContainerWidth / 1.8)
        .externalRadius(donutContainerWidth / 4)
        .internalRadius(donutContainerWidth / 8)

    var totalFat = data.protein * 4 + data.carbonhydrates * 4 + data.fat * 9
    var donutDataset = [{
            "name": "Protein",
            "id": 1,
            "quantity": data.protein * 4,
            "percentage": (100 * data.protein * 4 / totalFat).toFixed(2)
        },
        {
            "name": "Fat",
            "id": 2,
            "quantity": data.fat * 9,
            "percentage": (100 * data.fat * 9 / totalFat).toFixed(2)
        },
        {
            "name": "Carbonhydrates",
            "id": 3,
            "quantity": data.carbonhydrates * 4,
            "percentage": (100 * data.carbonhydrates * 4 / totalFat).toFixed(2)
        }
    ]
    donutContainer.datum(donutDataset).call(donutChart);

    var legendChart = britecharts.legend(),
        legendContainer = d3.select('.js-d-donut-legend-chart'),
        legendContainerWidth = legendContainer.node().getBoundingClientRect().width
    d3.select('.js-d-donut-legend-chart .britechart-legend').remove()

    legendChart
        .horizontal(true)
        .width(legendContainerWidth * 0.6)
        .markerSize(8)
        .height(40)
    legendContainer.datum(donutDataset).call(legendChart);
}

$(function () {
    var evtStreams = {}
    var map = L.map('js-d-map').setView([50.907571, -1.405120], 15);
    L.gridLayer.googleMutant({
        type: 'roadmap'
    }).addTo(map)

    var sidebar = L.control.sidebar('js-d-sidebar', {
        closeButton: false,
        position: 'left'
    })
    map.addControl(sidebar);
    evtStreams.mapClick = Bacon.fromEvent(map, 'click')

    setTimeout(function () {
        sidebar.show()
    }, 1000)

    loadData()
        .then(function (d) {
            renderMarkersOnMap(d, map, evtStreams)
            renderSidebar(d)
            evtStreams.markerClick.onValue(function (id) {
                renderSidebar(d, id)
            })
            evtStreams.mapClick.throttle(300).onValue(function () {
                renderSidebar(d)
            })
        })

    for (var i = 0; i < 50; i++) {
        var lat = 50.910 + Math.random() / 80
        var lon = -1.409 + Math.random() / 70
        L.marker([lat, lon], {
            icon: L.icon({
                iconUrl: 'images/ic_person_pin_circle_black_24px.svg',
                iconSize: [35, 35],
                className: 'd-map__icon'
            })
        }).addTo(map)
    }


    for (var i = 0; i < 50; i++) {
        var lat = 50.910 + Math.random() / 70
        var lon = -1.409 + Math.random() / 80
        L.marker([lat, lon], {
            icon: L.icon({
                iconUrl: 'images/ic_person_pin_circle_black_red.svg',
                iconSize: [35, 35],
                className: 'd-map__icon--red'
            })
        }).addTo(map)
    }

    Bacon.fromEvent($('.js-d-dialog__close-btn'), 'click').onValue(function () {
        document.querySelector('dialog').close();
    })

})