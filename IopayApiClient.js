const request = require('sync-request');
const package_json = require('./package.json');
const {Base64} = require('js-base64');

require('dotenv').config();

/**
 * Default request headers
 */
var default_api_request_headers = {
    "User-Agent": package_json.name + "/" + package_json.version
}

/**
 * Base URL for each application environment
 */
var api_environments = {
    PRODUCTION: "https://api.iopay.com.br/api/",
    SANDBOX: "https://sandbox.api.iopay.com.br/api/"
}

/**
 * @var {string} lib_api_base_url Base URL for IOPAY API
 */
var lib_api_base_url = process.env.IOPAY_API_BASE_URL ?? "";

/**
 * Authentication credentials with IOPAY API taken from environment variables
 */
var lib_credentials = 
{
    secret: process.env.IOPAY_AUTH_SECRET,
    email: process.env.IOPAY_AUTH_EMAIL,
    io_seller_id: process.env.IOPAY_AUTH_IO_SELLER_ID
}

/**
 * Token for communication with IOPAY API resources 
 */
var iopay_api_token = {};

/**
 * Token for communication with IOPAY API special resources (Tokenization, Customer cards)
 */
 var iopay_api_special_token = {};

/**
 * Must be sent in the object, or set environment variables
 * 
 * @param {Object} credentials IOPAY API integration credentials
 * @param {string} credentials.secret Your Secret Key; Or set the environment variable IOPAY_AUTH_SECRET
 * @param {string} credentials.email Your API connection email; Or set the environment variable IOPAY_AUTH_EMAIL
 * @param {string} credentials.io_seller_id Your IOPAY ID (IO Seller ID); Or set the environment variable IOPAY_AUTH_IO_SELLER_ID
 * 
 * @param {string} api_environment Is URL Base for IOPAY_API; By default is used base url of api_environments.PRODUCTION;
 */
function auth(credentials = {}, api_environment = ""){
    // setting credentials
    if(credentials.secret != undefined){ lib_credentials.secret = credentials.secret; }
    if(credentials.email != undefined){ lib_credentials.email = credentials.email; }
    if(credentials.io_seller_id != undefined){ lib_credentials.io_seller_id = credentials.io_seller_id; }

    // setting api base url
    if(api_environment && api_environment.length > 0){
        lib_api_base_url = api_environment;
    }else if(!lib_api_base_url || lib_api_base_url.length == 0){
        lib_api_base_url = api_environments.PRODUCTION;
    }

    let response = IopayApiAuthRequest(lib_credentials, lib_api_base_url + "auth/login");

    return response;
}

/**
 * Auth for special resources in IOPAY API (Tokenization, Customer cards)
 * 
 * Must be sent in the object, or set environment variables
 * 
 * @param {Object} credentials IOPAY API integration credentials
 * @param {string} credentials.secret Your Secret Key; Or set the environment variable IOPAY_AUTH_SECRET
 * @param {string} credentials.email Your API connection email; Or set the environment variable IOPAY_AUTH_EMAIL
 * @param {string} credentials.io_seller_id Your IOPAY ID (IO Seller ID); Or set the environment variable IOPAY_AUTH_IO_SELLER_ID
 * 
 * @param {string} api_environment Is URL Base for IOPAY_API; By default is used base url of api_environments.PRODUCTION;
 */
function authTokenization(credentials = {}, api_environment = ""){
    // setting credentials
    if(credentials.secret != undefined){ lib_credentials.secret = credentials.secret; }
    if(credentials.email != undefined){ lib_credentials.email = credentials.email; }
    if(credentials.io_seller_id != undefined){ lib_credentials.io_seller_id = credentials.io_seller_id; }

    // setting api base url
    if(api_environment && api_environment.length > 0){
        lib_api_base_url = api_environment;
    }else if(!lib_api_base_url || lib_api_base_url.length == 0){
        lib_api_base_url = api_environments.PRODUCTION;
    }

    let response = IopayApiAuthRequest(lib_credentials, lib_api_base_url + "v1/card/authentication");

    return response;
}

/**
 * Returns the token to be used in calls to the IOPAY API
 * @returns {string} bearer token
 */
function getApiToken(){

    // check for token with at least 10 seconds of validity remaining
    if(
        iopay_api_token.access_token && 
        iopay_api_token.expires_at && 
        (iopay_api_token.expires_at + 10) > (Date.now() / 1000)
    ){
        return iopay_api_token.access_token;
    }

    // request new token
    let request_auth = auth();

    // memorizes the new token and returns the value
    if(request_auth.body && request_auth.body.access_token){
        iopay_api_token = request_auth.body;
        return request_auth.body.access_token;
    }else{
        return null;
    }

}

/**
 * Returns the token to be used in IOPAY API for special resources (Tokenization, Customer cards)
 * @returns {string} bearer token
 */
function getSpecialApiToken(){
    
    // check for token with at least 10 seconds of validity remaining
    if(
        iopay_api_special_token.access_token && 
        iopay_api_special_token.expires_at && 
        (iopay_api_special_token.expires_at + 10) > (Date.now() / 1000)
    ){
        return iopay_api_special_token.access_token;
    }

    // request new token
    let request_auth = authTokenization();

    // memorizes the new token and returns the value
    if(request_auth.body && request_auth.body.access_token){
        iopay_api_special_token = request_auth.body;
        return request_auth.body.access_token;
    }else{
        return null;
    }

}

/**
 * Request to create token
 * @param {Object} auth_credentials
 * @param {string} auth_url 
 * @returns {import("sync-request").Response}
 */
function IopayApiAuthRequest(auth_credentials, auth_url){
    // request settings
    let request_settings = {
        headers: default_api_request_headers,
        json: auth_credentials,
        timeout: 30000, //specifies the number in milliseconds before the request times out
    }

    let response = request("POST", auth_url, request_settings);

    if(typeof response.body != 'undefined' && response.body){
        try{
            response.body = JSON.parse(response.body.toString());
        }catch(e){
            try{
                response.body = response.body.toString();
            }catch(e2){}
        }
    }

    try{
        if(response.body.expires_in && response.body.expires_in > 0){
            response.body.expires_at = Math.floor(Date.now() / 1000) + response.body.expires_in; // creation time + expiration time
        }
    }catch(e){}

    return response;
}

/**
 * Request for IOPAY API using Authentication Token
 * @param {string} Method Http verb: GET, POST, PUT, DELETE...
 * @param {string} Path Path to request
 * @param {Object} QueryParams Params to query
 * @param {Object} BodyParams Params to body
 * @returns {import("sync-request").Response}
 */
function IopayRequestWithToken(Method, Path, QueryParams = {}, BodyParams = {}){
    
    // Insert Authorization to header
    default_api_request_headers.Authorization = "Bearer " + getApiToken();
    
    // request settings - Options to request (https://www.npmjs.com/package/sync-request)
    let request_settings = {
        headers: default_api_request_headers,
        json: BodyParams ?? {},
        timeout: 30000, //specifies the number in milliseconds before the request times out
        qs: QueryParams
    }

    // call request
    let response = request(Method, lib_api_base_url + Path, request_settings);

    // decode body
    if(typeof response.body != 'undefined' && response.body){
        try{
            response.body = JSON.parse(response.body.toString());
        }catch(e){
            try{
                response.body = response.body.toString();
            }catch(e2){}
        }
    }

    return response;
}

/**
 * Request for IOPAY API using special Authentication Token (Card tokenization, manage customer cards)
 * @param {string} Method Http verb: GET, POST, PUT, DELETE...
 * @param {string} Path Path to request
 * @param {Object} QueryParams Params to query
 * @param {Object} BodyParams Params to body
 * @returns {import("sync-request").Response}
 */
 function IopayRequestWithSpecialToken(Method, Path, QueryParams = {}, BodyParams = {}){
    
    // Insert Authorization to header
    default_api_request_headers.Authorization = "Bearer " + getSpecialApiToken();
    
    // request settings - Options to request (https://www.npmjs.com/package/sync-request)
    let request_settings = {
        headers: default_api_request_headers,
        json: BodyParams ?? {},
        timeout: 30000, //specifies the number in milliseconds before the request times out
        qs: QueryParams
    }

    // call request
    let response = request(Method, lib_api_base_url + Path, request_settings);

    // decode body
    if(typeof response.body != 'undefined' && response.body){
        try{
            response.body = JSON.parse(response.body.toString());
        }catch(e){
            try{
                response.body = response.body.toString();
            }catch(e2){}
        }
    }

    return response;
}

module.exports = {
    apiEnvironments:api_environments, 
    auth, 
    authTokenization, 
    getApiToken, 
    getSpecialApiToken,

    requestApi: IopayRequestWithToken,
    requestApiwithSpecialToken: IopayRequestWithSpecialToken,

    /**
     * @returns {string} Your IOPAY Seller ID
     */
    getIoSellerId(){
        return lib_credentials.io_seller_id;
    },

    /**
     * Endpoints to manage customers
     */
    Customer: {
        /**
         * [POST] v1/customer/new
         * Create customer
         * @param {Object} CustomerData 
         * @returns {import('sync-request').Response}
         */
        create(CustomerData){ 
            return IopayRequestWithToken("POST", "v1/customer/new", {}, CustomerData); 
        },
        /**
         * [GET] v1/customer/get/:CustomerID
         * Get customer
         * @param {string} CustomerID 
         * @returns {import('sync-request').Response}
         */
        get(CustomerID){ 
            return IopayRequestWithToken("GET", "v1/customer/get/" + CustomerID); 
        },
        /**
         * [POST] v1/card/associate_token_with_customer
         * Associate tokenized card to customer
         * @param {string} CustomerID 
         * @param {string} TokenID id from tokenazed card
         * @returns {import('sync-request').Response}
         */
        associateCardToken(CustomerID, TokenID){ 
            return IopayRequestWithSpecialToken("POST", "v1/card/associate_token_with_customer", {}, {id_customer:CustomerID, token:TokenID}); 
        },
        /**
         * [GET] v1/card/list/:CustomerID
         * List associated cards of customer
         * @param {string} CustomerID 
         * @returns {import('sync-request').Response}
         */
        listCards(CustomerID){ 
            return IopayRequestWithSpecialToken("GET", "v1/card/list/" + CustomerID); 
        },
        /**
         * [GET] v1/card/set_default/:CustomerID
         * Define which is the main card for a Customer (credit transactions without "token" or "id_card")
         * @param {string} CustomerID 
         * @param {string} CardId id_card of associated card
         * @returns {import('sync-request').Response}
         */
        setDefaultCard(CustomerID, CardId){ 
            return IopayRequestWithSpecialToken("POST", "v1/card/set_default/" + CustomerID, {}, {id_card:CardId}); 
        },
        /**
         * [DELETE] v1/card/delete/:CustomerID/:CardId
         * Delete a customer associated card
         * @param {string} CustomerID 
         * @param {string} CardId id_card of associated card
         * @returns {import('sync-request').Response}
         */
        deleteCard(CustomerID, CardId){ 
            return IopayRequestWithSpecialToken("DELETE", "v1/card/delete/" + CustomerID + "/" + CardId); 
        },
        /**
         * [DELETE] v1/card/delete_all/:CustomerID
         * Delete all customer associated cards
         * @param {string} CustomerID 
         * @returns {import('sync-request').Response}
         */
        deleteAllCards(CustomerID){ 
            return IopayRequestWithSpecialToken("DELETE", "v1/card/delete_all/" + CustomerID); 
        },
    },

    /**
     * Tokenization
     */
    Tokenize: {
        /**
         * [POST] v1/card/tokenize/token
         * Tokenize a card
         * @param {Object} CardData 
         * @returns {import('sync-request').Response}
         */
        card(CardData){ return IopayRequestWithSpecialToken("POST", "v1/card/tokenize/token", {}, CardData); },
    },

    /**
     * Manage transactions
     */
    Transactions: {
        /**
         * [POST] v1/transaction/new/:CustomerID
         * Create new transaction (Credit, PIX, Boleto)
         * @param {string} CustomerID 
         * @param {Object} TransactionData 
         * @returns {import('sync-request').Response}
         */
        create(CustomerID, TransactionData){
            return IopayRequestWithToken("POST", "v1/transaction/new/" + CustomerID, {}, TransactionData);
        },
        /**
         * [POST] v1/transaction/void/:TransactionId
         * Reverse transaction (full or partial amount in cents)
         * @param {string} TransactionId 
         * @param {int} Amount value to reverse (in cents)
         * @returns {import('sync-request').Response}
         */
        cancel(TransactionId, Amount){
            return IopayRequestWithToken("POST", "v1/transaction/void/" + TransactionId, {}, {amount:Amount});
        },
        /**
         * [POST] v1/transaction/capture/:TransactionId
         * Capture pre_authorized transaction (full or partial amount in cents)
         * @param {string} TransactionId 
         * @param {int} Amount value to reverse (in cents)
         * @returns {import('sync-request').Response}
         */
        capture(TransactionId, Amount){
            return IopayRequestWithToken("POST", "v1/transaction/capture/" + TransactionId, {}, {amount:Amount});
        },
        /**
         * [GET] v1/transaction/get/:TransactionId
         * Get a transaction
         * @param {string} TransactionId 
         * @returns {import('sync-request').Response}
         */
        get(TransactionId){
            return IopayRequestWithToken("GET", "v1/transaction/get/" + TransactionId);
        },
        /**
         * [GET] v1/transaction/list
         * List all your transactions
         * @param {Object} QueryParams Params to filter and paginate your transactions
         * @returns {import('sync-request').Response}
         */
        getAll(QueryParams){
            return IopayRequestWithToken("GET", "v1/transaction/list", QueryParams);
        }
    }

};
