import logger from './logger';

const MongooseError = async (schema, options) => {
    schema.pre('insertMany', (next) => {
        next();
    });

    schema.post('insertMany', (err, next) => {
        if(err){
            logger.error(err);
        }
        next();
    });
}

export default MongooseError;