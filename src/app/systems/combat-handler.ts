import { System, EntityManager, Entity } from "rad-ecs";
import { Combat, Health, PhysicalMove, Position } from "../components.model";

export class CombatHandler implements System {
  private DISPARITY_MODIFIER = 0.5;
  private BASE_HIT_CHANCE = 0.5;
  private OVER_DAMAGE_FACTOR = 0.2;

  constructor() {}

  update(em: EntityManager): void {
    em.each(
      (e: Entity, pm: PhysicalMove, c: Combat) => {
        let combatTarget = this.combatTargetAt(pm.target, em);
        if (combatTarget) {
          let defender = combatTarget.component(Combat);
          let attacker = c;

          let attackModifier =
            (attacker.skill / defender.skill - 1) * this.DISPARITY_MODIFIER;
          let hitChance = this.BASE_HIT_CHANCE + attackModifier;
          let hitRoll = Math.random();

          // console.log(`hit chance: ${hitChance.toFixed(2)}, roll: ${hitRoll.toFixed(2)}`);
          if (hitRoll <= hitChance) {
            // console.log(`attack hit!`);
            let hitPower = (hitChance - hitRoll) * 100;
            // console.log(`strike power: ${hitPower} vs armor: ${defender.armor}`);
            if (hitPower > defender.armor) {
              // console.log(`attack beat targets armor!`);
              let overDamage =
                (hitPower - defender.armor) * this.OVER_DAMAGE_FACTOR;
              // console.log(`defender suffers ${overDamage.toFixed(0)} points of OVER damage`);
              let finalDamage = Math.round(attacker.damage + overDamage);
              // console.log(`defender suffers ${finalDamage.toFixed(0)} points of total damage!`);
              let defenderHealth = combatTarget.component(Health);
              // console.log(`health of defender is now: ${defenderHealth.current - finalDamage}`);
              em.setComponent(
                combatTarget.id,
                new Health(
                  defenderHealth.current - finalDamage,
                  defenderHealth.max
                )
              );
            }
          } else {
            // console.log(`attack missed!!`);
          }

          // remove the move command as it turned into an attack instead!
          em.removeComponent(e.id, PhysicalMove);
        }
      },
      PhysicalMove,
      Combat
    );
  }

  private combatTargetAt(pos: Position, em: EntityManager): Entity | null {
    return em
      .matchingIndex(pos)
      .filter((e: Entity) => e.has(Combat) && e.has(Health))
      .reduce((accum: Entity, curr: Entity) => curr, null);
  }
}
