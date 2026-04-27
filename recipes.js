let api_key = "de17710cd2854303bb9d6ad7e89bd0b5"
let ingredients = []

function addingredient(){
    let currentIn = $(".ingredient").val().trim();
    if (currentIn !== ""){
        ingredients.push($(".ingredient").val())
        $(".ingredient").val("")
        console.log(ingredients)
    }
}

function startover(){
    ingredients = []
}

function recipesearch(){
    let request = new XMLHttpRequest();
    let url = `https://api.spoonacular.com/recipes/findByIngredients?ingredients=${ingredients}&number=2&apiKey=${api_key}`;
    request.open("GET", url, true);
    request.onload = function() {
        let data = JSON.parse(this.response)
        if (request.status >= 200 && request.status < 400){
            let recipes = []
            for(let recipeIndex = 0; recipeIndex < data.length; recipeIndex++){
                console.log(data[recipeIndex].title)
                recipes.push({
                    "title": data[recipeIndex].title,
                    "missingIngredients": [],
                    "image": data[recipeIndex].image,
                })
                for (let i = 0; i < data[recipeIndex].missedIngredientCount; i++ ){
                    console.log(i)
                    recipes[recipeIndex].missingIngredients.push(data[recipeIndex].missedIngredients[i].originalName)
                }
            }
            console.log(recipes)
            for (let i = 0; i < recipes.length; i++) {
                $("body").append(`
                    <div class="recipe">
                    <h2>${recipes[i].title}</h2>
                    <img src="${recipes[i].image}">
                    <p>Missing: ${recipes[i].missingIngredients.join(", ")}</p>
                </div>
                `);
            }
            
        } else{
            console.log("error")
        };
    };
    request.send();
};