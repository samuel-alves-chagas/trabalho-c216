from flask import Flask, render_template, request, redirect, url_for, jsonify
import requests
import os

app = Flask(__name__)

# Definindo as variáveis de ambiente
API_BASE_URL = os.getenv("API_BASE_URL" , "http://localhost:5000/api/v1/carro")
API_DATABASE_RESET = os.getenv("API_DATABASE_RESET" , "http://localhost:5000/api/v1/database/reset") 

# Rota para a página inicial
@app.route('/')
def index():
    return render_template('index.html')

# Rota para exibir o formulário de cadastro
@app.route('/inserir', methods=['GET'])
def inserir_carro_form():
    return render_template('inserir.html')

# Rota para enviar os dados do formulário de cadastro para a API
@app.route('/inserir', methods=['POST'])
def inserir_carro():
    modelo = request.form['modelo']
    marca = request.form['marca']
    ano_fabricacao = request.form['ano_fabricacao']

    payload = {
        'modelo': modelo,
        'marca': marca,
        'ano_fabricacao': ano_fabricacao
    }

    response = requests.post(f'{API_BASE_URL}/inserir', json=payload)
    
    if response.status_code == 201:
        return redirect(url_for('listar_carros'))
    else:
        return "Erro ao inserir carro", 500

# Rota para listar todos os carros
@app.route('/listar', methods=['GET'])
def listar_carros():
    response = requests.get(f'{API_BASE_URL}/listar')
    carros = response.json()
    return render_template('listar.html', carros=carros)

# Rota para exibir o formulário de edição de carro
@app.route('/atualizar/<int:carro_id>', methods=['GET'])
def atualizar_carro_form(carro_id):
    response = requests.get(f"{API_BASE_URL}/listar")
    #filtrando apenas o carro correspondente ao ID
    carros = [carro for carro in response.json() if carro['id'] == carro_id]
    if len(carros) == 0:
        return "Carro não encontrado", 404
    carro = carros[0]
    return render_template('atualizar.html', carro=carro)

# Rota para enviar os dados do formulário de edição de carro para a API
@app.route('/atualizar/<int:carro_id>', methods=['POST'])
def atualizar_carro(carro_id):
    modelo = request.form['modelo']
    marca = request.form['marca']
    ano_fabricacao = request.form['ano_fabricacao']

    payload = {
        'id': carro_id,
        'modelo': modelo,
        'marca': marca,
        'ano_fabricacao': ano_fabricacao
    }

    response = requests.post(f"{API_BASE_URL}/atualizar", json=payload)
    
    if response.status_code == 200:
        return redirect(url_for('listar_carros'))
    else:
        return "Erro ao atualizar carro", 500

# Rota para excluir um carro
@app.route('/excluir/<int:carro_id>', methods=['POST'])
def excluir_carro(carro_id):
    payload = {'id': carro_id}

    response = requests.post(f"{API_BASE_URL}/excluir", json=payload)
    
    if response.status_code == 200  :
        return redirect(url_for('listar_carros'))
    else:
        return "Erro ao excluir carro", 500

#Rota para resetar o database
@app.route('/reset-database', methods=['GET'])
def resetar_database():
    response = requests.delete(API_DATABASE_RESET)
    
    if response.status_code == 200  :
        return redirect(url_for('index'))
    else:
        return "Erro ao resetar o database", 500


if __name__ == '__main__':
    app.run(debug=True, port=3000, host='0.0.0.0')
