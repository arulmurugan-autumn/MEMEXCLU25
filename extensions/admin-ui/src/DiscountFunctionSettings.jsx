import { render } from "preact";
import { useState, useEffect, useMemo } from "preact/hooks";

const METAFIELD_NAMESPACE = "$app:memexclu-discount";
const METAFIELD_KEY = "function-configuration";

export default async () => {
  const existingDefinition = await getMetafieldDefinition();
  if (!existingDefinition) {
    const metafieldDefinition = await createMetafieldDefinition();
    if (!metafieldDefinition) {
      throw new Error("Failed to create metafield definition");
    }
  }

  render(<App />, document.body);
};

// ─── Metafield Definition Helpers ─────────────────────────────────────────

async function getMetafieldDefinition() {
  const query = `#graphql
    query GetMetafieldDefinition {
      metafieldDefinitions(
        first: 1,
        ownerType: DISCOUNT,
        namespace: "${METAFIELD_NAMESPACE}",
        key: "${METAFIELD_KEY}"
      ) {
        nodes {
          id
        }
      }
    }
  `;

  const result = await shopify.query(query);
  return result?.data?.metafieldDefinitions?.nodes?.[0];
}

async function createMetafieldDefinition() {
  const definition = {
    access: {
      admin: "MERCHANT_READ_WRITE",
    },
    key: METAFIELD_KEY,
    name: "MEMEXCLU Discount Configuration",
    namespace: METAFIELD_NAMESPACE,
    ownerType: "DISCOUNT",
    type: "json",
  };

  const query = `#graphql
    mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
      metafieldDefinitionCreate(definition: $definition) {
        createdDefinition {
          id
        }
      }
    }
  `;

  const result = await shopify.query(query, { variables: { definition } });
  return result?.data?.metafieldDefinitionCreate?.createdDefinition || null;
}

// ─── Parse Metafield ───────────────────────────────────────────────────────

function parseMetafield(value) {
  try {
    const parsed = JSON.parse(value || "{}");
    return {
      discountMessage: parsed.discountMessage ?? "",
    };
  } catch {
    return {
      discountMessage: "",
    };
  }
}

// ─── useExtensionData Hook ─────────────────────────────────────────────────

function useExtensionData() {
  const { applyMetafieldChange, i18n, data } = shopify;

  const metafieldConfig = useMemo(
    () =>
      parseMetafield(
        data?.metafields?.find(
          (metafield) => metafield.key === METAFIELD_KEY
        )?.value
      ),
    [data?.metafields]
  );

  const [config, setConfig] = useState(metafieldConfig);
  const [initialConfig, setInitialConfig] = useState(metafieldConfig);

  useEffect(() => {
    setConfig(metafieldConfig);
    setInitialConfig(metafieldConfig);
  }, [metafieldConfig]);

  const onConfigChange = (key, value) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  async function applyExtensionMetafieldChange() {
    await applyMetafieldChange({
      type: "updateMetafield",
      namespace: METAFIELD_NAMESPACE,
      key: METAFIELD_KEY,
      value: JSON.stringify(config),
      valueType: "json",
    });
    setInitialConfig(config);
  }

  const resetForm = () => {
    setConfig(initialConfig);
  };

  return {
    applyExtensionMetafieldChange,
    i18n,
    config,
    onConfigChange,
    resetForm,
  };
}

// ─── App ───────────────────────────────────────────────────────────────────

function App() {
  const {
    applyExtensionMetafieldChange,
    config,
    onConfigChange,
    resetForm,
  } = useExtensionData();

  return (
    <s-function-settings
      onSubmit={(event) => event.waitUntil(applyExtensionMetafieldChange())}
      onReset={resetForm}
    >
      <s-stack gap="base">

        {/* ── Discount Message Setting ── */}
        <s-section>
          <s-stack gap="base">
            <s-text-field
              label="Discount Message"
              name="discountMessage"
              value={String(config.discountMessage ?? "")}
              placeholder="e.g. MEMEXCLU25"
              onChange={(event) =>
                onConfigChange("discountMessage", event.currentTarget.value)
              }
            />
            <s-text tone="subdued">
              This message will appear on the cart line when the discount is
              applied to eligible products. Leave empty to show no message.
            </s-text>
          </s-stack>
        </s-section>

        {/* ── Preview ── */}
        {config.discountMessage?.trim() && (
          <s-section>
            <s-text>Preview</s-text>
            <s-stack gap="base">
              <s-box>
                <s-inline spacing="base">
                  <s-text tone="subdued">Message shown to customer:</s-text>
                  <s-text>{config.discountMessage.trim()}</s-text>
                </s-inline>
              </s-box>
            </s-stack>
          </s-section>
        )}

      </s-stack>
    </s-function-settings>
  );
}