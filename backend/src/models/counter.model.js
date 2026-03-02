import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    sequenceValue: {
        type: Number,
        default: 0,
        required: true
    }
});

// Static method to get next sequence value
counterSchema.statics.getNextSequenceValue = async function (sequenceName) {
    const counter = await this.findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { sequenceValue: 1 } },
        {
            new: true,
            upsert: true,
            setDefaultsOnInsert: true
        }
    );
    return counter.sequenceValue;
};

// Static method to reset sequence (for testing or maintenance)
counterSchema.statics.resetSequence = async function (sequenceName, value = 0) {
    return await this.findOneAndUpdate(
        { _id: sequenceName },
        { sequenceValue: value },
        {
            new: true,
            upsert: true
        }
    );
};

export default mongoose.model("Counter", counterSchema);
