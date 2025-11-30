export async function incrementCounter() {
  const { data, error } = await supabase
    .from("counter")
    .select("value")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Counter read error:", error);
    return null;
  }

  const newValue = data.value + 1;

  const { error: updateError } = await supabase
    .from("counter")
    .update({ value: newValue })
    .eq("id", 1);

  if (updateError) {
    console.error("Counter update error:", updateError);
    return null;
  }

  return newValue;
}
