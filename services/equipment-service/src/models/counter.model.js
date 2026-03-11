import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    sequence_value: { type: Number, default: 0 }
});

counterSchema.statics.getNextSequenceValue = async function (sequenceName) {
    const sequenceDocument = await this.findOneAndUpdate(
        { _id: sequenceName },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
    );
    return sequenceDocument.sequence_value;
};

export default mongoose.model("Counter", counterSchema);
