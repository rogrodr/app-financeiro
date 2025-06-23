import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';

interface Transaction {
  id: string;
  date: string;
  description: string;
  operation: 'Crédito' | 'Débito';
  value: number;
  cardId: string;
}

interface Card {
  id: string;
  nomeCartao: string;
  numeroCartao: string;
  cvv: string;
  validade: string;
}

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
  standalone: false,
})
export class FolderPage implements OnInit {
  public folder!: string;
  private idCounter: number = 0;
  public cartao: Card = {
    id: '',
    nomeCartao: '',
    numeroCartao: '',
    cvv: '',
    validade: '',
  };
  public cartoes: Card[] = [];
  public selectedCardId: string = '';
  public transaction: Transaction = {
    id: '',
    date: new Date().toISOString(),
    description: '',
    operation: 'Crédito',
    value: 0,
    cardId: '',
  };
  public transactions: Transaction[] = [];

  private activatedRoute = inject(ActivatedRoute);
  private alertController = inject(AlertController);

  async ngOnInit() {
    await this.loadData();
    this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;
    console.log('ngOnInit executado. Folder:', this.folder);
  }

  async loadData() {
    try {
      this.cartoes = JSON.parse(localStorage.getItem('cartoes') || '[]') || [];
      this.transactions = JSON.parse(localStorage.getItem('transactions') || '[]') || [];
      console.log('Dados carregados:', { cartoes: this.cartoes, transactions: this.transactions });
      if (this.cartoes.length > 0) {
        this.selectedCardId = this.cartoes[0].id;
      }
    } catch (error) {
      console.error('Erro ao carregar dados do localStorage:', error);
      await this.showAlert('Erro', 'Falha ao carregar os dados. Tente novamente.');
    }
  }

  async adicionarCartao() {
    if (!this.cartao.nomeCartao || !this.cartao.numeroCartao || !this.cartao.cvv || !this.cartao.validade) {
      await this.showAlert('Erro', 'Por favor, preencha todos os campos do cartão.');
      return;
    }

    const novoCartao: Card = {
      id: this.cartao.id || this.gerarId(),
      nomeCartao: this.cartao.nomeCartao,
      numeroCartao: this.cartao.numeroCartao,
      cvv: this.cartao.cvv,
      validade: this.cartao.validade,
    };

    if (this.cartao.id) {
      const index = this.cartoes.findIndex((item) => item.id === this.cartao.id);
      if (index !== -1) {
        this.cartoes[index] = novoCartao;
      }
    } else {
      this.cartoes.push(novoCartao);
    }

    try {
      localStorage.setItem('cartoes', JSON.stringify(this.cartoes));
      console.log('Cartão salvo:', novoCartao);
      this.limparFormularioCartao();
      if (!this.selectedCardId) {
        this.selectedCardId = novoCartao.id;
      }
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
      await this.showAlert('Erro', 'Falha ao salvar o cartão. Tente novamente.');
    }
  }

  async adicionarTransacao() {
    if (!this.selectedCardId) {
      await this.showAlert('Erro', 'Selecione um cartão antes de adicionar uma transação.');
      return;
    }
    if (!this.transaction.description || !this.transaction.value || this.transaction.value <= 0) {
      await this.showAlert('Erro', 'Por favor, preencha todos os campos da transação corretamente.');
      return;
    }

    const novaTransacao: Transaction = {
      id: this.gerarId(),
      date: new Date(this.transaction.date).toLocaleDateString('pt-BR'),
      description: this.transaction.description,
      operation: this.transaction.operation,
      value: this.transaction.value,
      cardId: this.selectedCardId,
    };

    this.transactions.push(novaTransacao);
    try {
      localStorage.setItem('transactions', JSON.stringify(this.transactions));
      console.log('Transação salva:', novaTransacao);
      this.limparFormularioTransacao();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      await this.showAlert('Erro', 'Falha ao salvar a transação. Tente novamente.');
    }
  }

  editarCartao(id: string) {
    const cartao = this.cartoes.find((item) => item.id === id);
    if (cartao) {
      this.cartao = { ...cartao };
      console.log('Editando cartão:', cartao);
    }
  }

  async excluirCartao(id: string) {
    this.cartoes = this.cartoes.filter((item) => item.id !== id);
    this.transactions = this.transactions.filter((item) => item.cardId !== id);
    try {
      localStorage.setItem('cartoes', JSON.stringify(this.cartoes));
      localStorage.setItem('transactions', JSON.stringify(this.transactions));
      console.log('Cartão excluído:', id);
      if (this.selectedCardId === id) {
        this.selectedCardId = this.cartoes.length > 0 ? this.cartoes[0].id : '';
      }
      this.limparFormularioCartao();
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
      await this.showAlert('Erro', 'Falha ao excluir o cartão. Tente novamente.');
    }
  }

  getTransactionsByCard(): Transaction[] {
    return this.transactions.filter((t) => t.cardId === this.selectedCardId);
  }

  getBalance(): number {
    return this.getTransactionsByCard().reduce((sum, transaction) => {
      return transaction.operation === 'Crédito' ? sum + transaction.value : sum - transaction.value;
    }, 0);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  private limparFormularioCartao() {
    this.cartao = { id: '', nomeCartao: '', numeroCartao: '', cvv: '', validade: '' };
  }

  private limparFormularioTransacao() {
    this.transaction = {
      id: '',
      date: new Date().toISOString(),
      description: '',
      operation: 'Crédito',
      value: 0,
      cardId: this.selectedCardId,
    };
  }

  private async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  private gerarId(): string {
    return `${this.idCounter++}`;
  }
}