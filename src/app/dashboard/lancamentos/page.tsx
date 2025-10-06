"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock } from "lucide-react";

interface Categoria {
  id: string;
  nome: string;
  tipo: string;
  cor: string;
}

interface Cartao {
  id: string;
  nome: string;
  bandeira: string;
  cor: string;
}

interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  tipo: string;
  metodoPagamento: string;
  data: string;
  pago: boolean;
  tipoParcelamento?: string;
  parcelasTotal?: number;
  parcelaAtual?: number;
  recorrente?: boolean;
  dataFimRecorrencia?: string;
  categoria: Categoria;
  cartao?: Cartao;
  lancamentosFilhos?: Lancamento[];
}

export default function LancamentosPage() {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [mostrarPrevisoes, setMostrarPrevisoes] = useState(false);
  const [previsoesFuturas, setPrevisoesFuturas] = useState<any[]>([]);
  const [mesPrevisao, setMesPrevisao] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    tipo: "DESPESA",
    metodoPagamento: "PIX",
    categoriaId: "",
    cartaoId: "",
    observacoes: "",
    tipoParcelamento: "AVISTA",
    parcelasTotal: "2",
    recorrente: false,
    dataFimRecorrencia: "",
  });

  useEffect(() => {
    carregarDados();
  }, []);
  // Função para carregar previsões
  const carregarPrevisoes = async () => {
    try {
      const res = await fetch(
        `/api/lancamentos/recorrencias-futuras?mes=${mesPrevisao}`
      );
      if (res.ok) {
        const data = await res.json();
        setPrevisoesFuturas(data);
      }
    } catch (error) {
      console.error("Erro ao carregar previsões:", error);
    }
  };

  // Chame esta função quando mostrarPrevisoes mudar para true
  useEffect(() => {
    if (mostrarPrevisoes) {
      carregarPrevisoes();
    }
  }, [mostrarPrevisoes, mesPrevisao]);
  const carregarDados = async () => {
    try {
      setLoading(true);
      const [lancamentosRes, categoriasRes, cartoesRes] = await Promise.all([
        fetch("/api/lancamentos"),
        fetch("/api/categorias"),
        fetch("/api/cartoes"),
      ]);

      if (lancamentosRes.ok) {
        const lancamentosData = await lancamentosRes.json();
        setLancamentos(Array.isArray(lancamentosData) ? lancamentosData : []);
      }

      if (categoriasRes.ok) {
        const categoriasData = await categoriasRes.json();
        setCategorias(Array.isArray(categoriasData) ? categoriasData : []);
      }

      if (cartoesRes.ok) {
        const cartoesData = await cartoesRes.json();
        if (Array.isArray(cartoesData)) {
          setCartoes(cartoesData);
        } else {
          console.error("Resposta de cartões não é um array:", cartoesData);
          setCartoes([]);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setLancamentos([]);
      setCategorias([]);
      setCartoes([]);
    } finally {
      setLoading(false);
    }
  };
  const criarTodasRecorrencias = async (recorrenciaId: string) => {
    if (
      !confirm(
        "Deseja criar TODOS os lançamentos futuros desta recorrência de uma vez?"
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/lancamentos/criar-todas-recorrencias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recorrenciaId }),
      });

      if (res.ok) {
        const result = await res.json();
        toast.success(result.message);
        carregarDados(); // Recarregar a lista
        carregarPrevisoes(); // Recarregar previsões
      } else {
        const error = await res.json();
        toast.error(error.error);
      }
    } catch (error) {
      console.error("Erro ao criar recorrências:", error);
      toast.error("Erro ao criar recorrências");
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/lancamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          valor: parseFloat(formData.valor),
          parcelasTotal: parseInt(formData.parcelasTotal),
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({
          descricao: "",
          valor: "",
          tipo: "DESPESA",
          metodoPagamento: "PIX",
          categoriaId: "",
          cartaoId: "",
          observacoes: "",
          tipoParcelamento: "AVISTA",
          parcelasTotal: "2",
          recorrente: false,
          dataFimRecorrencia: "",
        });
        carregarDados();
      } else {
        const errorData = await res.json();
        console.error("Erro na resposta:", errorData);
        alert(errorData.error || "Erro ao criar lançamento");
      }
    } catch (error) {
      console.error("Erro ao criar lançamento:", error);
      alert("Erro ao criar lançamento");
    }
  };
  const categoriasFiltradas = categorias.filter(
    (cat) => cat.tipo === formData.tipo
  );
  // Resetar campos quando mudar o método de pagamento
  const handleMetodoPagamentoChange = (metodo: string) => {
    setFormData({
      ...formData,
      metodoPagamento: metodo,
      tipoParcelamento: metodo === "CREDITO" ? "AVISTA" : "AVISTA",
      parcelasTotal: "2",
      cartaoId: metodo === "CREDITO" ? formData.cartaoId : "",
    });
  };

  const toggleStatus = async (lancamentoId: string, atualStatus: boolean) => {
    try {
      const response = await fetch(`/api/lancamentos/${lancamentoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pago: !atualStatus,
        }),
      });

      if (response.ok) {
        toast.success("Status atualizado com sucesso!");
        carregarDados(); // Recarregar a lista
      } else {
        throw new Error("Erro ao atualizar status");
      }
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      toast.error("Erro ao alterar status");
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-gray-600">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Lançamentos</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            {showForm ? "Cancelar" : "Novo Lançamento"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-6 rounded-lg shadow-md mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="Ex: Aluguel, Salário, Mercado..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.valor}
                  onChange={(e) =>
                    setFormData({ ...formData, valor: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="DESPESA">Despesa</option>
                  <option value="RECEITA">Receita</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Método de Pagamento
                </label>
                <select
                  value={formData.metodoPagamento}
                  onChange={(e) => handleMetodoPagamentoChange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="PIX">PIX</option>
                  <option value="TRANSFERENCIA">Transferência</option>
                  <option value="DEBITO">Cartão de Débito</option>
                  <option value="CREDITO">Cartão de Crédito</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  required
                  value={formData.categoriaId}
                  onChange={(e) =>
                    setFormData({ ...formData, categoriaId: e.target.value })
                  }
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Selecione uma categoria</option>
                  {categoriasFiltradas.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
                {categoriasFiltradas.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    Nenhuma categoria encontrada para{" "}
                    {formData.tipo === "DESPESA" ? "despesa" : "receita"}.
                    <a
                      href="/categorias"
                      className="text-blue-600 underline ml-1"
                    >
                      Criar categoria
                    </a>
                  </p>
                )}
              </div>

              {formData.metodoPagamento === "CREDITO" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cartão
                  </label>
                  <select
                    required
                    value={formData.cartaoId}
                    onChange={(e) =>
                      setFormData({ ...formData, cartaoId: e.target.value })
                    }
                    className="w-full p-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Selecione um cartão</option>
                    {Array.isArray(cartoes) &&
                      cartoes.map((cartao) => (
                        <option key={cartao.id} value={cartao.id}>
                          {cartao.nome}
                        </option>
                      ))}
                  </select>
                  {(!Array.isArray(cartoes) || cartoes.length === 0) && (
                    <p className="text-sm text-red-600 mt-1">
                      Nenhum cartão encontrado.
                      <a
                        href="/cartoes"
                        className="text-blue-600 underline ml-1"
                      >
                        Criar cartão
                      </a>
                    </p>
                  )}
                </div>
              )}

              {/* CAMPOS DE PARCELAMENTO - AGORA VISÍVEIS */}
              {formData.metodoPagamento === "CREDITO" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Pagamento
                    </label>
                    <select
                      value={formData.tipoParcelamento}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          tipoParcelamento: e.target.value,
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="AVISTA">À Vista (1x)</option>
                      <option value="PARCELADO">Parcelado</option>
                      <option value="RECORRENTE">
                        Recorrente (Assinatura)
                      </option>
                    </select>
                  </div>

                  {/* CAMPO DE PARCELAS - SEMPRE VISÍVEL QUANDO FOR PARCELADO */}
                  {formData.tipoParcelamento === "PARCELADO" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Parcelas
                      </label>
                      <select
                        value={formData.parcelasTotal}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            parcelasTotal: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                          <option key={num} value={num.toString()}>
                            {num}x
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.tipoParcelamento === "RECORRENTE" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Final da Recorrência
                      </label>
                      <input
                        type="date"
                        required
                        value={formData.dataFimRecorrencia}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dataFimRecorrencia: e.target.value,
                          })
                        }
                        className="w-full p-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* INFORMAÇÕES DO PARCELAMENTO */}
            {formData.metodoPagamento === "CREDITO" &&
              formData.tipoParcelamento === "PARCELADO" &&
              formData.valor && (
                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Detalhes do parcelamento:</strong>
                    <br />• Valor total: R${" "}
                    {parseFloat(formData.valor).toFixed(2)}
                    <br />• {formData.parcelasTotal} parcelas de R${" "}
                    {(
                      parseFloat(formData.valor) /
                      parseInt(formData.parcelasTotal)
                    ).toFixed(2)}
                    <br />• Primeira parcela em{" "}
                    {new Date().toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}

            {formData.metodoPagamento === "CREDITO" &&
              formData.tipoParcelamento === "AVISTA" && (
                <div className="mt-4 p-3 bg-green-50 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>Pagamento à vista:</strong> O valor será cobrado na
                    próxima fatura.
                  </p>
                </div>
              )}

            {formData.metodoPagamento === "CREDITO" &&
              formData.tipoParcelamento === "RECORRENTE" && (
                <div className="mt-4 p-3 bg-purple-50 rounded-md">
                  <p className="text-sm text-purple-800">
                    <strong>Recorrência mensal:</strong> Será criado um
                    lançamento automático todo mês.
                  </p>
                </div>
              )}

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                className="w-full p-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Observações adicionais..."
              />
            </div>

            <button
              type="submit"
              className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
              disabled={
                !formData.categoriaId ||
                (formData.metodoPagamento === "CREDITO" &&
                  !formData.cartaoId) ||
                (formData.metodoPagamento === "CREDITO" &&
                  formData.tipoParcelamento === "RECORRENTE" &&
                  !formData.dataFimRecorrencia)
              }
            >
              Salvar Lançamento
            </button>
          </form>
        )}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Previsões de Recorrências
            </h2>
            <div className="flex gap-2">
              <input
                type="month"
                value={mesPrevisao}
                onChange={(e) => setMesPrevisao(e.target.value)}
                className="p-2 border border-gray-300 rounded-md"
              />
              <button
                onClick={() => setMostrarPrevisoes(!mostrarPrevisoes)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
              >
                {mostrarPrevisoes
                  ? "Ocultar Previsões"
                  : "Ver Previsões Futuras"}
              </button>
            </div>
          </div>

          {mostrarPrevisoes && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
              {previsoesFuturas.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nenhuma previsão de recorrência encontrada.
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-purple-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Descrição
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Categoria
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Cartão
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Data Prevista
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {previsoesFuturas.map((previsao) => (
                      <tr
                        key={previsao.id}
                        className={previsao.jaExiste ? "bg-green-50" : ""}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="mr-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                              🔄
                            </span>
                            {previsao.descricao}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {previsao.jaExiste ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              ✅ Criado
                            </span>
                          ) : (
                            <div className="flex gap-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                ⏳ Pendente
                              </span>
                              {previsao.ehOriginal && (
                                <button
                                  onClick={() =>
                                    criarTodasRecorrencias(
                                      previsao.lancamentoPaiId
                                    )
                                  }
                                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200"
                                >
                                  Criar Todos
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={
                              previsao.tipo === "RECEITA"
                                ? "text-green-600 font-medium"
                                : "text-red-600 font-medium"
                            }
                          >
                            R$ {previsao.valor.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${previsao.categoria.cor}20`,
                              color: previsao.categoria.cor,
                            }}
                          >
                            {previsao.categoria.nome}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {previsao.cartao?.nome || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(previsao.data).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {previsao.jaExiste ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                              ✅ Já lançado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                              ⏳ Pendente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
        {/* Resto do código da tabela permanece igual */}
        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          {" "}
          {/* Mudei para overflow-x-auto */}
          {lancamentos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Nenhum lançamento encontrado. Clique em "Novo Lançamento" para
              começar.
            </div>
          ) : (
            <table className="w-full min-w-max">
              {" "}
              {/* Adicionei min-w-max */}
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Descrição
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Categoria
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Método
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Data
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lancamentos.map((lancamento) => (
                  <>
                    <tr key={lancamento.id}>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {lancamento.parcelasTotal &&
                            lancamento.parcelasTotal > 1 && (
                              <span className="mr-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {lancamento.parcelaAtual}/
                                {lancamento.parcelasTotal}
                              </span>
                            )}
                          {lancamento.recorrente && (
                            <span className="mr-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              🔄
                            </span>
                          )}
                          <span className="text-sm">
                            {lancamento.descricao}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={
                            lancamento.tipo === "RECEITA"
                              ? "text-green-600 font-medium text-sm"
                              : "text-red-600 font-medium text-sm"
                          }
                        >
                          R$ {lancamento.valor.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: `${lancamento.categoria.cor}20`,
                            color: lancamento.categoria.cor,
                          }}
                        >
                          {lancamento.categoria.nome}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div>
                          <div>{lancamento.metodoPagamento}</div>
                          {lancamento.cartao && (
                            <div className="text-xs text-gray-500">
                              {lancamento.cartao.nome}
                            </div>
                          )}
                          {lancamento.tipoParcelamento && (
                            <div className="text-xs text-gray-500">
                              ({lancamento.tipoParcelamento.toLowerCase()})
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {new Date(lancamento.data).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <button
                          onClick={() =>
                            toggleStatus(lancamento.id, lancamento.pago)
                          }
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                            lancamento.pago
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          }`}
                        >
                          {lancamento.pago ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Pago
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 mr-1" />
                              Pendente
                            </>
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Mostrar parcelas filhas */}
                    {lancamento.lancamentosFilhos?.map((parcela) => (
                      <tr key={parcela.id} className="bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap pl-8">
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="mr-2 text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded">
                              {parcela.parcelaAtual}/{parcela.parcelasTotal}
                            </span>
                            {parcela.descricao}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          R$ {parcela.valor.toFixed(2)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${parcela.categoria.cor}20`,
                              color: parcela.categoria.cor,
                            }}
                          >
                            {parcela.categoria.nome}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div>
                            <div>{parcela.metodoPagamento}</div>
                            {parcela.cartao && (
                              <div className="text-xs text-gray-500">
                                {parcela.cartao.nome}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(parcela.data).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              toggleStatus(parcela.id, parcela.pago)
                            }
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                              parcela.pago
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            }`}
                          >
                            {parcela.pago ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Pago
                              </>
                            ) : (
                              <>
                                <Clock className="w-3 h-3 mr-1" />
                                Pendente
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
