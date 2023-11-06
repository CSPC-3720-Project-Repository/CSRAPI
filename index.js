
const AWS = require("aws-sdk");

AWS.config.update({region: "us-east-1"});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbTableName = "CSRAPI";
const csrPath = "/csr";
const csrParamPathTicket = "/csr/{ticketID}";
const csrParamPathRep = "/csr/{repID}";
const csrParamPathCustomer = "/csr/{customerID}";

exports.handler = async function(event){
    console.log("Request event method: ", event.httpMethod);
    console.log("EVENT\n" + JSON.stringify(event, null, 2));
    let response;

    switch(true){
        case event.httpMethod === "GET" && event.requestContext.resourcePath === csrPath:
        response = await getCSR(event.queryStringParameters.id);
        break;

        case event.httpMethod === "GET" && event.requestContext.resourcePath === csrParamPathTicket:
        response = await getCSR(event.pathParameters.TicketID);
        break;

        case event.httpMethod === "GET" && event.requestContext.resourcePath === csrParamPathRep:
        response = await getCSR(event.pathParameters.RepID);
        break;

        case event.httpMethod === "GET" && event.requestContext.resourcePath === csrParamPathCustomer:
        response = await getCSR(event.pathParameters.CustomerID);
        break;

        case event.httpMethod === "POST" && event.requestContext.resourcePath === csrPath:
        response = await saveCSR(JSON.parse(event.body));
        break;

        case event.httpMethod === "PATCH" && event.requestContext.resourcePath === csrPath:
        const requestBody = JSON.parse(event.body);
        response = await modifyCSR(requestBody.id, requestBody.updateKey,
        requestBody.updateValue);
        break;

        case event.httpMethod === "DELETE" && event.requestContext.resourcePath === csrPath:
    //response = await deleteCSR(JSON.parse(event.body).id);
        response = await deleteCSR(event.queryStringParameters.id);
        break;

        default:
        response = buildResponse(404, event.requestContext.resourcePath);
    }
    return response;
}

async function getCSR(TicketID) {
    const params = {
        TableName: dynamodbTableName,
        Key: {
        "id": TicketID
        }
    }
    return await dynamodb.get(params).promise().then((response) => {
    return buildResponse(200, response.Item);
    }, (error) => {
        console.error("Error retrieving ticket. ",
        error);
    });
}

async function getCSR(RepID) {
    const params = {
        TableName: dynamodbTableName,
        Key: {
        "id": RepID
        }
    }
    return await dynamodb.get(params).promise().then((response) => {
    return buildResponse(200, response.Item);
    }, (error) => {
        console.error("Error retrieving ticket. ",
        error);
    });
}

async function getCSR(CustomerID) {
    const params = {
        TableName: dynamodbTableName,
        Key: {
        "id": CustomerID
        }
    }
    return await dynamodb.get(params).promise().then((response) => {
    return buildResponse(200, response.Item);
    }, (error) => {
        console.error("Error retrieving ticket. ",
        error);
    });
}

async function getCSRS() {
    const params = {
        TableName: dynamodbTableName
    }
    const allCSR = await scanDynamoRecords(params, []);
    const body = {
        csr: allCSR
    }
    return buildResponse(200, body);
}

async function scanDynamoRecords(scanParams, itemArray) {
    try {
        const dynamoData = await dynamodb.scan(scanParams).promise();
        itemArray = itemArray.concat(dynamoData.Items);
        if (dynamoData.LastEvaluatedKey) {
            scanParams.ExclusiveStartkey = dynamoData.LastEvaluatedKey;
            return await scanDynamoRecords(scanParams, itemArray);
        }
        return itemArray;
    } catch(error) {
        console.error('Error returning itemArray ',
        error);
    }
}

async function saveCSR(requestBody) {
    const params = {
        TableName: dynamodbTableName,
        Item: requestBody
    }
    return await dynamodb.put(params).promise().then(() => {
    const body = {
    Operation: "SAVE",
    Message: "SUCCESS",
    Item: requestBody
    }
    return buildResponse(200, body);
    }, (error) => {
        console.error("Error saving the ticket. ",
        error);
    })
}

async function deleteCSR(TicketID) {
    const params = {
        TableName: dynamodbTableName,
        Key: {
        "id": TicketID
        },
        ReturnValues: "ALL_OLD"
    }
    return await dynamodb.delete(params).promise().then((response) => {
        const body = {
            Operation: "DELETE",
            Message: "SUCCESS",
            Item: response
        }
        return buildResponse(200, body);
    }, (error) => {
        console.error("Error deleting the ticket: ",
        error);
    })
}

async function modifyCSR(TicketID, updateKey, updateValue) {
    const params = {
        TableName: dynamodbTableName,
        Key: {
        "id": TicketID
        },
        UpdateExpression: `set ${updateKey} = :value`,
        ExpressionAttributeValues: {
        ":value": updateValue
        },
        ReturnValues: "UPDATED_NEW"
    }
    return await dynamodb.update(params).promise().then((response) => {
    const body = {
        Operation: "UPDATE",
        Message: "SUCCESS",
        UpdatedAttributes: response
    }
    return buildResponse(200, body);
    }, (error) => {
        console.error("Error updating the ticket. ",
        error);
    })
}

function buildResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
        "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    }
}



