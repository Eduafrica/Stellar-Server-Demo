import mongoose from "mongoose";

const CategoriesSchema = new mongoose.Schema({
    name: {
        type: String
    },
    slug: {
        type: String
    }
},
{ timestamps: true }
)

const CategoriesModel = mongoose.model('categorie', CategoriesSchema)
export default CategoriesModel