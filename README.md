# IOPAY API SDK NodeJs

Esta biblioteca é um auxiliar para integração com os serviços da **API IOPAY**; É importante que você leia os recursos e parâmetros de utilização na **[Documentação da API IOPAY - https://docs-api.iopay.com.br/)](https://docs-api.iopay.com.br/)**

---

## Instalação

Faça a instalação da dependência:

- NPM

```bash
npm install iopay-payments/iopay-api-sdk-nodejs
```

- Yarn

```bash
yarn add iopay-payments/iopay-api-sdk-nodejs
```

---

## Credenciais e autenticação

### Método 1: salvar credenciais nas variáveis de ambiente

Utilize as seguintes variáveis de ambiente para que a SDK possa se autenticar automáticamente ao realizar chamadas para API IOPAY

| Variável de Ambiente    | Descrição                                                                                             |
| ----------------------- | :---------------------------------------------------------------------------------------------------- |
| IOPAY_API_BASE_URL      | URL base para conexão com API IOPAY; Por padrão, para Produção utilize <https://api.iopay.com.br/api/>|
| IOPAY_AUTH_SECRET       | Chave secreta para conexão com API IOPAY                                                              |
| IOPAY_AUTH_EMAIL        | Email para conexão com API IOPAY                                                                      |
| IOPAY_AUTH_IO_SELLER_ID | Sua identificação na API IOPAY (IOPAY Seller ID)                                                      |

Quando suas credenciais estiverem salvas em variáveis de ambiente, não é necessário utilizar a função `IopayClient.auth()` para se autenticar na API IOPAY

```javascript
const IopayClient = require("iopay-api-sdk-nodejs/IopayApiClient");

// Enjoy API
let transactionsList = IopayClient.Transactions.getAll({limit: 50, page:2});
```

### Método 2: inserir as credenciais na função `IopayClient.auth()` para autenticação com a API IOPAY

Utilize a função `IopayClient.auth()` caso suas credenciais não estejam nas variáveis de ambiente

```javascript
const IopayClient = require("iopay-api-sdk-nodejs/IopayApiClient");

let myCredentials = {
    secret:         "my_secret_xxx",
    email:          "main@mail.com",
    io_seller_id:   "my_iopay_seller_id"
};

//Insert your credentials, and API environment base URL
IopayClient.auth(myCredentials, IopayClient.apiEnvironments.SANDBOX)

// After auth, enjoy API
let transactionsList = IopayClient.Transactions.getAll({limit: 50, page:2});
```

---

## Funções `IopayClient`

### `IopayClient.apiEnvironments`

Objeto com as URL's base para conexão com API IOPAY;

- string `IopayClient.apiEnvironments.PRODUCTION`

- string `IopayClient.apiEnvironments.SANDBOX`

### `IopayClient.requestApi(Method, Path, QueryParams = {}, BodyParams = {})`

Realizar requisição autenticada para API IOPAY;
O retorno será um objeto do tipo `Object{Response}`

### `IopayClient.requestApiwithSpecialToken(Method, Path, QueryParams = {}, BodyParams = {})`

Realizar requisição para API IOPAY com autenticação para tokenização e gestão de cartões de um customer
O retorno será um objeto do tipo `Object{Response}`

### `IopayClient.getIoSellerId()`

Recupera seu IO Seller ID (utilizado na autenticação)
O retorno será uma `string` com seu IO Seller ID

---

## Funções para Tokenização: `IopayClient.Tokenize`

**Os retornos das chamadas serão um objeto do tipo `Object{Response}`**

### `IopayClient.Tokenize.card(CardData)`

Tokenizar cartão de crédito

- [POST] v1/card/tokenize/token

---

## Funções para gestão dos Clientes (customer): `IopayClient.Customer`

**Os retornos das chamadas serão um objeto do tipo `Object{Response}`**

### `IopayClient.Customer.create(CustomerData)`

Criar customer

- [POST] v1/customer/new

### `IopayClient.Customer.get(CustomerID)`

Recuperar customer pelo ID

- [GET] v1/customer/get/:CustomerID

### `IopayClient.Customer.associateCardToken(CustomerID, TokenID)`

Associar Cartão tokenizado á um customer

- [POST] v1/card/associate_token_with_customer

### `IopayClient.Customer.listCards(CustomerID)`

Listar cartões associados a um Customer

- [GET] v1/card/list/:CustomerID

### `IopayClient.Customer.setDefaultCard(CustomerID, CardId)`

Definir qual é o cartão principal de um customer (transações de crédito sem "token" ou "id_card")

- [GET] v1/card/set_default/:CustomerID

### `IopayClient.Customer.deleteCard(CustomerID, CardId)`

Deleta um cartão associado ao customer

- [DELETE] v1/card/delete/:CustomerID/:CardId

### `IopayClient.Customer.deleteAllCards(CustomerID)`

Deleta todos os cartões associados ao customer

- [DELETE] v1/card/delete_all/:CustomerID

---

## Funções para gestão de Transações: `IopayClient.Transactions`

**Os retornos das chamadas serão um objeto do tipo `Object{Response}`**

### `IopayClient.Transactions.create(CustomerID, TransactionData)`

Criar nova transação; Crédito, Boleto, PIX;
O objeto `TransactionData` será construído de acordo com o tipo de transação desejada, e dados adicionais (Split, antifraude e demais dados necessários descritos na [Documentação da API IOPAY](https://docs-api.iopay.com.br/) )

- [POST] v1/transaction/new/:CustomerID

### `IopayClient.Transactions.cancel(TransactionId, Amount)`

Cancelar transação; Valor total ou parcial

- [POST] v1/transaction/void/:TransactionId

### `IopayClient.Transactions.capture(TransactionId, Amount)`

Capturar transação; Valor total ou parcial

- [POST] v1/transaction/capture/:TransactionId

### `IopayClient.Transactions.get(TransactionId)`

Recuperar uma transação pelo ID

- [GET] v1/transaction/get/:TransactionId

### `IopayClient.Transactions.getAll(QueryParams)`

Recuperar listagem de todas as suas transações; Incluindo no objeto `QueryParams` as propriedades para filtragem e paginação descritos na [Documentação da API IOPAY](https://docs-api.iopay.com.br/) )

- [GET] v1/transaction/list
