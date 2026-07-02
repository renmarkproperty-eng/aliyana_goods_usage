import type { PurposeMenuGroup } from "@/lib/pengambilan-barang";

export function PurposeMenuCell({ groups }: { groups: PurposeMenuGroup[] }) {
  if (!groups || groups.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  return (
    <div className="min-w-[220px] divide-y rounded-md border">
      {groups.map((group, index) => {
        const total = group.menus.reduce((sum, row) => sum + row.jumlah, 0);
        return (
        <div
          key={index}
          className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-3 px-2 py-1.5"
        >
          <span className="font-medium">
            {group.purpose} ({total})
          </span>
          <ol className="list-decimal space-y-0.5 pl-4">
            {group.menus.map((row, menuIndex) => (
              <li key={menuIndex}>
                {row.menu}{" "}
                <span className="text-muted-foreground">({row.jumlah})</span>
              </li>
            ))}
          </ol>
        </div>
        );
      })}
    </div>
  );
}
